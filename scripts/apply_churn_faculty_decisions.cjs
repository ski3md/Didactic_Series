#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const defaultChurnPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_contract_aligned_content.json');
const defaultFacultyReviewPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_faculty_review_packet.json');
const defaultOutputJsonPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_promotion_state_packet.json');
const defaultOutputMdPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_promotion_state_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const stableJson = (value) => JSON.stringify(value, null, 2) + '\n';
const isFilled = (value) => typeof value === 'string' && value.trim().length > 0;
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(String(value || ''));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const decisionOptions = new Set(['approve_for_promotion', 'revise_with_local_evidence', 'reassign_topic', 'retire_or_supersede']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    mode: 'draft',
    churnPath: defaultChurnPath,
    facultyReviewPath: defaultFacultyReviewPath,
    outputJsonPath: defaultOutputJsonPath,
    outputMdPath: defaultOutputMdPath,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === '--mode') {
      parsed.mode = next;
      index += 1;
    } else if (arg === '--churn-path') {
      parsed.churnPath = path.resolve(repoRoot, next);
      index += 1;
    } else if (arg === '--faculty-review-path') {
      parsed.facultyReviewPath = path.resolve(repoRoot, next);
      index += 1;
    } else if (arg === '--output-json') {
      parsed.outputJsonPath = path.resolve(repoRoot, next);
      index += 1;
    } else if (arg === '--output-md') {
      parsed.outputMdPath = path.resolve(repoRoot, next);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['draft', 'validate'].includes(parsed.mode)) throw new Error('--mode must be draft or validate');
  return parsed;
};

const completedSignoff = (signoff) =>
  Boolean(
    signoff &&
      isFilled(signoff.reviewer_name) &&
      isFilled(signoff.reviewer_role) &&
      isIsoDate(signoff.review_date) &&
      decisionOptions.has(signoff.decision) &&
      isFilled(signoff.notes)
  );

const applyDecision = (item, packet) => {
  const signoff = item.required_signoff_fields || {};
  const decision = signoff.decision || 'pending';
  const hasCompletedSignoff = completedSignoff(signoff);
  const base = {
    packet_id: item.packet_id,
    abpath_topic: item.abpath_topic,
    source_map_id: item.source?.source_map_id || packet?.source_map_id || null,
    decision,
    completed_signoff: hasCompletedSignoff,
    reviewer_name: signoff.reviewer_name || '',
    reviewer_role: signoff.reviewer_role || '',
    review_date: signoff.review_date || '',
    notes: signoff.notes || '',
    original_promotion_status: packet?.promotion_status || item.review_status?.promotion_status || 'review-queue',
  };

  if (decision === 'approve_for_promotion' && hasCompletedSignoff) {
    return {
      ...base,
      applied_status: 'promotion-ready',
      promotion_ready: true,
      blocking_reasons: [],
      next_action: 'Bounded promotion may proceed after standard repo validation.',
    };
  }

  if (decision === 'revise_with_local_evidence' && hasCompletedSignoff) {
    return {
      ...base,
      applied_status: 'revision-required',
      promotion_ready: false,
      blocking_reasons: ['faculty_revision_requested'],
      next_action: 'Revise deterministic local evidence and regenerate churn packets.',
    };
  }

  if (decision === 'reassign_topic' && hasCompletedSignoff) {
    return {
      ...base,
      applied_status: 'reassignment-required',
      promotion_ready: false,
      blocking_reasons: ['faculty_reassignment_requested'],
      next_action: 'Update topic/source-map assignment before any content promotion.',
    };
  }

  if (decision === 'retire_or_supersede' && hasCompletedSignoff) {
    return {
      ...base,
      applied_status: 'superseded',
      promotion_ready: false,
      blocking_reasons: ['faculty_retired_or_superseded'],
      next_action: 'Record supersession rationale and exclude from promotion queue.',
    };
  }

  return {
    ...base,
    applied_status: 'review-queue',
    promotion_ready: false,
    blocking_reasons: ['faculty_review_required_before_promotion'],
    next_action: 'Collect completed faculty signoff before promotion.',
  };
};

const buildPromotionState = (churn, facultyReview) => {
  const packetsById = new Map((churn.packets || []).map((packet) => [packet.packet_id, packet]));
  const applied_items = (facultyReview.review_items || []).map((item) => applyDecision(item, packetsById.get(item.packet_id)));
  const countBy = (field) =>
    applied_items.reduce((counts, item) => {
      counts[item[field]] = (counts[item[field]] || 0) + 1;
      return counts;
    }, {});

  return {
    packet_version: 'local-content-churner-promotion-state.v1',
    runtime: facultyReview.runtime,
    source_packets: {
      churn_packet: 'reports/curriculum/local_content_churner/churn_contract_aligned_content.json',
      faculty_review_packet: 'reports/curriculum/local_content_churner/churn_faculty_review_packet.json',
    },
    promotion_policy: {
      promotion_requires_completed_faculty_signoff: true,
      pending_decisions_remain_blocked: true,
      advisory_ai_review_can_promote: false,
    },
    summary: {
      total_items: applied_items.length,
      promotion_ready: applied_items.filter((item) => item.promotion_ready).length,
      blocked: applied_items.filter((item) => !item.promotion_ready).length,
      by_applied_status: countBy('applied_status'),
      by_decision: countBy('decision'),
    },
    applied_items,
  };
};

const renderMarkdown = (payload) => [
  '# Local Content Churner Promotion State Packet',
  '',
  `AI_DEPENDENCY: ${payload.runtime.ai_dependency}`,
  `NETWORK_ACCESS: ${payload.runtime.network_access}`,
  `SOURCE_MODE: ${payload.runtime.source_mode}`,
  `PROMOTION_READY_PACKETS: ${payload.summary.promotion_ready}`,
  `BLOCKED_PACKETS: ${payload.summary.blocked}`,
  '',
  '| Packet | Topic | Decision | Applied status | Promotion ready | Next action |',
  '| --- | --- | --- | --- | --- | --- |',
  ...payload.applied_items.map(
    (item) =>
      `| ${item.packet_id} | ${item.abpath_topic} | ${item.decision} | ${item.applied_status} | ${item.promotion_ready ? 'yes' : 'no'} | ${item.next_action} |`
  ),
  '',
].join('\n');

const validatePromotionState = (payload) => {
  const failures = [];
  if (payload.runtime?.ai_dependency !== 'NONE') failures.push('promotion state must preserve AI_DEPENDENCY: NONE');
  if (payload.runtime?.network_access !== 'NONE') failures.push('promotion state must preserve NETWORK_ACCESS: NONE');
  if (payload.runtime?.source_mode !== 'LOCAL_ONLY') failures.push('promotion state must preserve SOURCE_MODE: LOCAL_ONLY');

  for (const item of payload.applied_items || []) {
    if (item.promotion_ready && item.applied_status !== 'promotion-ready') {
      failures.push(`${item.packet_id}: promotion_ready true requires applied_status=promotion-ready`);
    }
    if (item.promotion_ready && !item.completed_signoff) {
      failures.push(`${item.packet_id}: promotion_ready true requires completed faculty signoff`);
    }
    if (item.decision === 'pending' && item.promotion_ready) {
      failures.push(`${item.packet_id}: pending decision cannot be promotion-ready`);
    }
  }

  return failures;
};

const main = () => {
  const options = parseArgs();
  const churn = readJson(options.churnPath);
  const facultyReview = readJson(options.facultyReviewPath);
  const payload = buildPromotionState(churn, facultyReview);
  const json = stableJson(payload);
  const markdown = renderMarkdown(payload);
  const failures = validatePromotionState(payload);

  if (failures.length > 0) {
    console.error(`Churn promotion-state application failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  if (options.mode === 'draft') {
    ensureDir(options.outputJsonPath);
    fs.writeFileSync(options.outputJsonPath, json);
    fs.writeFileSync(options.outputMdPath, markdown);
  } else {
    if (!fs.existsSync(options.outputJsonPath) || fs.readFileSync(options.outputJsonPath, 'utf8') !== json) {
      throw new Error('Stored promotion-state JSON does not match deterministic regeneration.');
    }
    if (!fs.existsSync(options.outputMdPath) || fs.readFileSync(options.outputMdPath, 'utf8') !== markdown) {
      throw new Error('Stored promotion-state Markdown does not match deterministic regeneration.');
    }
  }

  console.log('[CHURN-PROMOTION-STATE] Application passed.');
  console.log(`AI_DEPENDENCY: ${payload.runtime.ai_dependency}`);
  console.log(`NETWORK_ACCESS: ${payload.runtime.network_access}`);
  console.log(`SOURCE_MODE: ${payload.runtime.source_mode}`);
  console.log(`PROMOTION_READY_PACKETS: ${payload.summary.promotion_ready}`);
  console.log(`BLOCKED_PACKETS: ${payload.summary.blocked}`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
