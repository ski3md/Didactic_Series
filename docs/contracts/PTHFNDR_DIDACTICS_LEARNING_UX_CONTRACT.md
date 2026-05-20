# P@thfndr Didactics Learning UX Contract

## Purpose
This contract governs how `/didactics` must behave as a learning environment.

The goal is not merely to look polished.
The goal is to remove software friction from learning, preserve orientation, accelerate diagnostic reasoning, and keep the learner inside a stable study flow.

## Prime Rule
The interface should disappear psychologically.

The learner should feel:
- oriented
- guided
- immersed
- rewarded
- intellectually engaged

The learner should not feel like they are managing software overhead, debugging navigation, or translating the site architecture for themselves.

## Core Outcomes
Every didactics route must optimize for:
- cognitive load reduction
- rapid orientation
- uninterrupted diagnostic reasoning flow
- memory reinforcement
- error-centered learning
- fast recovery after mistakes
- long-session stability
- trust and authority

## Plain-Language Contract
Learner-facing text must describe study actions in plain language.

Prefer:
- topic
- lesson
- group
- study path
- next step
- time estimate
- common trap

Avoid on public learner-facing pages:
- workspace narration when a simple section name will do
- governance language
- systems language
- architecture metaphors
- route jargon
- internal implementation labels
- technical counting language such as `decision nodes`

If a phrase sounds like it belongs in an internal design review instead of a study session, rewrite it.

Plain-language failures include learner-facing labels or helper copy such as:
- `Active workspace`
- `Open workspace`
- `workspace cue`
- `destination tree`
- `workspace landing`
- `validated topic`
- `subtopic overview`

These may be acceptable as internal implementation concepts.
They are not acceptable as public study guidance unless a genuine medical teaching meaning is being expressed.

## Anti-Meta / Anti-Self-Narration Contract
Never expose internal reasoning, implementation narration, self-awareness, or workflow commentary on learner-facing surfaces.

Forbidden public phrasing includes:
- `I'm going to`
- `I confirmed`
- `The likely win is`
- `Let me`
- `Next tranche`
- `Highest-value slice`
- `The agent determined`
- `Implementation details`
- `Fallback path`

These belong in:
- logs
- developer notes
- governance artifacts
- internal execution traces

They do not belong in:
- participant interfaces
- educational pages
- reviewer flows
- manuscripts
- onboarding screens

Convert internal process language into direct instructional or informational language.

## Intentional Click Contract
Every clickable element must:
1. establish expectation
2. preserve context
3. advance the current reasoning path
4. reduce cognitive load

Each click target should make all of the following obvious:
- current learner state
- expected destination
- why this is the next logical step
- what context persists
- what the learner can do next

Avoid vague or decorative click labels such as:
- `Learn more`
- `Continue`
- `Resources`
- `Workups`
- `Practice`

Exception:
- the governed workspace label `Workups` is allowed only when it truthfully names the active diagnostic-workup lane in the workspace switcher, breadcrumb, or destination heading
- `Workups` must not be reused as a generic CTA, teaser button, or unlabeled route hint outside that governed workspace identity

Prefer labels that reveal the destination and reason to click, such as:
- `Review Spindle Cell Differential`
- `Compare NIFTP vs Encapsulated FVPTC`
- `Open CAP Synoptic Checklist`
- `Start 5-Question GI Practice Set`
- `Review Margin Assessment Criteria`

The learner should be able to predict the destination before clicking.

## Cognitive Continuity Contract
Every page must preserve a coherent learning chain:

orientation
-> morphologic recognition
-> differential diagnosis
-> confirmatory studies
-> reporting or staging
-> pitfalls
-> retention or practice

Do not interrupt this chain with:
- unrelated modules
- mixed taxonomies
- marketing surfaces
- random navigation chips
- parallel learning modes that do not advance the current task

## Ontology Separation Contract
Do not mix fundamentally different concept types in the same visual cluster.

Keep separate:
- morphologic patterns
- specimen types
- workflow actions
- learning modes
- reporting tools
- disease entities

If these concepts are not all needed for the current task, remove or defer them rather than giving them equal visual weight.

## Elimination Of Unnecessary Labels
Do not label elements whose purpose is already obvious from layout and context.

Avoid:
- redundant headers
- repetitive section titles
- over-explanation
- instructional clutter
- UI narration

When structure alone communicates meaning, remove the label.

## Anti-Semantic-Crowding Contract
Do not present multiple conceptual systems with equal visual weight unless they truly belong to the same task.

The primary task must dominate visually.

Secondary material should be:
- collapsed
- below the fold
- progressively revealed
- or shown only when context requires it

When the page goal is immediate task entry, anything not supporting trust, comprehension, or immediate action is a distraction.

## Human-Like Study Navigation Contract
Navigation should feel like expert attending guidance during board preparation.

The learner should feel:
- progressively oriented
- contextually guided
- never abandoned
- never overloaded
- never forced to infer the next step

Each click should feel like:
`Of course this is what I should look at next.`

## Pathology Vernacular Normalization Contract
All learner-facing terminology must sound natural in AP/CP training, signout, and board preparation.

Prefer:
- morphology-centered terminology
- diagnostic workflow terminology
- signout terminology
- board-prep terminology
- CAP, WHO, and AJCC aligned language
- phrases used by residents, fellows, and attendings

Avoid:
- corporate EdTech language
- generic LMS terminology
- software abstraction language
- competency-framework jargon
- AI-generated abstraction
- generic educational phrasing that is not pathology-native

Use language that sounds like:
- real pathology signout
- attending teaching
- board review
- subspecialty preview
- diagnostic workup discussion

Replace educational-abstraction labels with pathology-native labels.

Examples:
- `Learning goal` -> `Diagnostic focus`, `Board-relevant focus`, or `What you should recognize`
- `basic ancillary logic` -> `Initial immunostain approach`, `Common confirmatory studies`, or `How the diagnosis is confirmed`
- `Build rotation-level organ-system differential diagnosis` -> `Develop organ-based differentials` or `Work through common board-style differentials`

Prefer verbs such as:
- Review
- Compare
- Distinguish
- Recognize
- Correlate
- Stage
- Grade
- Classify
- Confirm
- Evaluate
- Work up
- Sign out
- Interpret
- Approach

Avoid verbs such as:
- Explore
- Discover
- Unlock
- Learn about
- Engage with
- Mastery pathway
- Competency progression

Every label, button, section title, and navigation element should answer:
`Would this sound natural during pathology training or board preparation?`

## System-Level Frictionless Learning Rule
At any moment, the learner must be able to answer within one viewport:

1. where am I
2. what is the current study workspace
3. what topic or subtopic is active
4. what should I do next
5. what changed as a result of my last click

If any of these are ambiguous, the route fails contract.

## Workspace Ownership Contract
The didactics experience has four governed study workspaces:
- Curriculum
- Lectures
- Tutorials
- Workups

Rules:
- one workspace owns the main panel at a time
- workspace selection must be visually explicit
- the page title, heading, and main-panel content must agree on the active workspace
- a workspace click must never behave like a passive filter mutation
- a workspace click must always produce a visible content-state change in the main panel

Forbidden:
- keeping the same main-panel landing state after a workspace switch
- showing a Tutorials-branded header while a different workspace is active
- allowing hidden state to own the route while the visible UI implies something else

## Sidebar Partition Contract
The left sidebar is a constrained navigation surface, not a mixed control dump.

It must be divided into this order:

1. global product identity
2. workspace switcher
3. active workspace destination tree
4. optional secondary actions

Rules:
- workspace switching and topic selection must be visually separated
- only the active workspace's destination tree should be expanded
- inactive workspaces must not dump their topic taxonomies into the same persistent list
- topic trees must narrow with selection rather than continuously broadcasting the full library

Forbidden:
- mixing workspace controls and all topic families into one undifferentiated stack
- showing the full topic universe when a scoped topic tree is expected
- making the learner infer which controls affect navigation versus filtering

## Main Panel Singularity Contract
Only active study material belongs in the main panel.

The main panel must render exactly one of:
- workspace landing
- topic overview
- subtopic overview
- item detail

Rules:
- landing must be guided, not empty
- topic overview must be scoped, not a full library dump
- subtopic overview must show only content within that subtopic
- item detail must foreground the study material, not surrounding catalog chrome

Forbidden:
- dead-end prompts such as "choose from the sidebar" without meaningful landing guidance
- persistent catalog clutter above active study material
- redundant headers that restate navigation without advancing learning

## Immediate Response Contract
Every meaningful learner click must produce an immediate, visible response.

Examples:
- workspace selected
- topic selected
- subtopic selected
- tutorial selected
- algorithm selected
- back selected

Visible response means at least one of:
- heading changes
- breadcrumb changes
- active tree changes
- main-panel content changes
- route state changes with clear active emphasis

If a click appears successful but the visible content does not change, the route fails contract.

## First-Time Learner Contract
An unfamiliar user must be able to enter `/didactics` and orient without prior training.

The landing experience must communicate:
- what this part of the platform is for
- where to begin
- how to continue prior work
- how to move from broad topic selection into focused study

The first-time learner should not need to:
- decode internal architecture
- guess whether a click worked
- differentiate hidden route state from visible route state
- reconcile duplicate labels or inconsistent naming

## Taxonomy Integrity Contract
The learning taxonomy must behave as stable teaching structure.

Rules:
- duplicate or near-duplicate public labels are forbidden
- topic labels must be normalized across sidebar, heading, cards, and detail views
- board-facing labels and ABPath-facing labels may coexist, but their relationship must be explicit

Forbidden:
- duplicate public labels such as parallel slash-format variants
- inconsistent workspace naming between sidebar and content header
- exposing internal staging language or implementation metaphors on the public surface
- exposing UI-architecture labels such as `destination tree`, `workspace landing`, or `subtopic overview` on the public learner surface

## Destination View Contract
Selecting a tutorial, lecture, algorithm, case, or teaching session must open a true destination view.

Every destination view must provide:
- route back to its parent overview
- preserved prior state
- immediate scope framing
- visible workspace identity
- topic and subtopic context

The learner should never wonder whether they are still in a catalog, in a topic overview, or inside the actual lesson.

## Orientation Frame Contract
At the top of every study destination view, show the minimal orientation frame before the main body:
- workspace
- topic or module
- item title
- concise scope line
- ABPath scope or governed content frame when applicable
- why it matters
- common trap when relevant
- estimated effort when relevant

This frame must be compact.
It should orient the learner, not push the teaching content below the fold.

## Cognitive Load Contract
Do not reveal everything at once.

Required techniques:
- progressive disclosure
- chunking
- whitespace

Preferred information buckets:
- Histology
- IHC
- Molecular
- Differential
- Pitfalls

Avoid:
- one long undifferentiated teaching block
- stacked summary banners above live content
- redundant labels that compete with the active task

## Stability Contract
Educational medical software must feel trustworthy before it feels impressive.

Forbidden:
- layout jumping
- flashing
- inconsistent controls
- lost progress
- route resets that discard learner context
- workspace switches that visually fail to resolve

## Navigation Truthfulness Contract
Visible navigation must tell the truth about system state.

Rules:
- if `Tutorials` is active, the main heading and visible content must reflect Tutorials
- if `Workups` is active, the main heading and visible content must reflect Workups
- if a topic is selected, only that topic's governed content should dominate the main panel
- the back path must mirror the learner's actual journey

The system must not rely on hidden session state to contradict the visible page.

## Accessibility Contract
Must support:
- keyboard navigation
- screen readers
- scalable text
- contrast compliance
- reduced motion compatibility

Accessibility support must not be implemented as decorative clutter or surface noise.

## Trust and Information Integrity Contract
Every route should expose or inherit:
- source transparency
- version tracking
- ABPath alignment
- review status visibility

Users must trust both the content and the platform behavior.

## Permanent Failure Classes
The following are system-level failures and must be treated as contract violations:
- these failure names must stay aligned with the machine-readable `routeFailureClasses` in `src/content/contracts/pthfndrDidacticsLearningUxContract.json`
- workspace click with no visible main-panel change
- duplicated public topic labels
- mixed workspace identity in the same viewport
- main panel showing catalog scaffolding instead of active study content
- sidebar showing too much global taxonomy for the current task
- redundant headers displacing the actual lesson
- route context drifting away from the selected module, topic, or workspace
- learner-facing meta jargon that explains the software structure instead of the study task

## Acceptance Gates
This contract is satisfied only when all of the following are true:
- these gate names must stay aligned with the machine-readable `routeAcceptanceGates` in `src/content/contracts/pthfndrDidacticsLearningUxContract.json`
- every didactics workspace change visibly changes the main panel
- the sidebar clearly separates workspace switching from topic navigation
- only the active workspace tree is expanded
- landing pages are guided and actionable
- topic overviews are scoped and do not dump unrelated library content
- selected tutorials, lectures, and algorithms open true destination views
- duplicate public taxonomy labels are eliminated
- the header, breadcrumb, and main panel agree on workspace identity
- the learner can return from item detail to subtopic, topic, and workspace landing predictably
- active study content reaches the learner without redundant header clutter displacing it
