#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const defaultChurnPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_contract_aligned_content.json');
const defaultFacultyReviewPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_faculty_review_packet.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const isFilled = (value) => typeof value === 'string' && value.trim().length > 0;
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(String(value || ''));

const promotionStates = new Set(['promoted', 'promotion-ready', 'ready-for-promotion', 'approved_for_promotion']);
const decisionOptions = new Set(['approve_for_promotion', 'revise_with_local_evidence', 'reassign_topic', 'retire_or_supersede']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    churnPath: defaultChurnPath,
    facultyReviewPath: defaultFacultyReviewPath,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === '--churn-path') {
      parsed.churnPath = path.resolve(repoRoot, next);
      index += 1;
    } else if (arg === '--faculty-review-path') {
      parsed.facultyReviewPath = path.resolve(repoRoot, next);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

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

const main = () => {
  const options = parseArgs();
  const churn = readJson(options.churnPath);
  const facultyReview = readJson(options.facultyReviewPath);
  const failures = [];
  const summary = {
    review_items: 0,
    pending: 0,
    approved_for_promotion: 0,
    revise_with_local_evidence: 0,
    reassign_topic: 0,
    retire_or_supersede: 0,
  };

  if (facultyReview.runtime?.ai_dependency !== 'NONE') failures.push('faculty review packet must preserve AI_DEPENDENCY: NONE');
  if (facultyReview.runtime?.network_access !== 'NONE') failures.push('faculty review packet must preserve NETWORK_ACCESS: NONE');
  if (facultyReview.runtime?.source_mode !== 'LOCAL_ONLY') failures.push('faculty review packet must preserve SOURCE_MODE: LOCAL_ONLY');

  const packetsById = new Map((churn.packets || []).map((packet) => [packet.packet_id, packet]));
  const reviewItems = facultyReview.review_items || [];
  summary.review_items = reviewItems.length;

  if (reviewItems.length !== packetsById.size) {
    failures.push(`faculty review item count ${reviewItems.length} does not match churn packet count ${packetsById.size}`);
  }

  for (const item of reviewItems) {
    const packet = packetsById.get(item.packet_id);
    if (!packet) {
      failures.push(`${item.packet_id}: no matching churn packet`);
      continue;
    }

    const signoff = item.required_signoff_fields || {};
    const hasCompletedSignoff = completedSignoff(signoff);
    const decision = signoff.decision || 'pending';
    const itemPromotionStatus = item.review_status?.promotion_status || '';
    const packetPromotionStatus = packet.promotion_status || '';
    const promotionReady =
      item.evidence_score?.promotion_ready === true ||
      packet.evidence_score?.promotion_ready === true ||
      promotionStates.has(itemPromotionStatus) ||
      promotionStates.has(packetPromotionStatus);

    if (decision === 'pending') {
      summary.pending += 1;
      if (promotionReady) failures.push(`${item.packet_id}: pending decision cannot be promotion-ready`);
      if (!item.review_status?.blocking_reasons?.includes('faculty_review_required_before_promotion')) {
        failures.push(`${item.packet_id}: pending decision must retain faculty_review_required_before_promotion blocker`);
      }
    } else if (decisionOptions.has(decision)) {
      summary[decision] += 1;
      if (!hasCompletedSignoff) {
        failures.push(`${item.packet_id}: ${decision} decision is missing completed faculty signoff fields`);
      }
    } else {
      failures.push(`${item.packet_id}: unsupported faculty decision ${decision}`);
    }

    if (promotionReady && !hasCompletedSignoff) {
      failures.push(`${item.packet_id}: promoted or promotion-ready packet lacks completed faculty signoff`);
    }

    if (signoff.decision === 'approve_for_promotion' && !hasCompletedSignoff) {
      failures.push(`${item.packet_id}: approve_for_promotion requires reviewer_name, reviewer_role, review_date, decision, and notes`);
    }
  }

  if (failures.length > 0) {
    console.error(`Churn faculty review validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('[CHURN-FACULTY-REVIEW] Validation passed.');
  console.log(`AI_DEPENDENCY: ${facultyReview.runtime.ai_dependency}`);
  console.log(`NETWORK_ACCESS: ${facultyReview.runtime.network_access}`);
  console.log(`SOURCE_MODE: ${facultyReview.runtime.source_mode}`);
  console.log(`REVIEW_ITEMS: ${summary.review_items}`);
  console.log(`PENDING_DECISIONS: ${summary.pending}`);
  console.log(`APPROVED_FOR_PROMOTION: ${summary.approved_for_promotion}`);
};

main();
