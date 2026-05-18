# P@thfndr Didactics Learning UX Contract

## Purpose
This contract governs how `/didactics` should behave as a learning environment, not just as a webpage.

The goal is to reduce cognitive load, accelerate orientation, preserve diagnostic reasoning flow, reinforce memory encoding, improve error recovery, sustain engagement through long study sessions, and increase trust in the platform.

## Prime Rule
The interface should disappear psychologically.

The learner should feel:
- oriented
- guided
- immersed
- rewarded
- intellectually engaged

The learner should not feel like they are managing software overhead.

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

## Required Page Regions
Every major didactics destination route should resolve into four clear regions:

1. Orientation zone:
   Where am I? Why does this matter? What should I do next?
2. Working zone:
   The main active learning task.
3. Support zone:
   Pearls, pitfalls, differentials, hover-linked support, and optional deep dives.
4. Feedback zone:
   Progress, mastery updates, alerts, remediation, and next recommended work.

Recommended spatial model:
- Left sidebar: navigation and context
- Main panel: active work
- Right panel: pearls and pitfalls
- Bottom dock: notes and review queue

## Visual Hierarchy Contract
The learner must understand three things within one viewport:

1. where they are
2. what matters most
3. what to do next

Use:
- H1 for page mission
- H2 for module or domain
- H3 for active section or task
- body text for actionable content

Forbidden:
- equal visual weight everywhere
- dense walls of text above the fold
- inconsistent spacing that blurs hierarchy

## Navigation Contract
Core navigation must remain stable.

Persistent navigation should include:
- Home
- Dashboard
- Didactics
- Cases
- Weak Areas
- Search
- Progress
- Settings

Rules:
- never move core navigation locations casually
- use icon and text together
- highlight current location clearly

Breadcrumbs are required for deeper content routes.

Example:
`CP > Transfusion Medicine > Hemolytic Reactions > DAT Interpretation`

## Destination View Contract
Selecting a tutorial, lecture, case, or teaching session must open a destination view.

It should not remain only a highlighted card in a library list.

Every destination view must provide:
- clear route back to the source library
- preserved prior state
- immediate scope framing

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

Avoid one long undifferentiated teaching block when structured clusters would work.

## Immediate Context Contract
At the top of every tutorial or teaching-session destination view, show:
- ABPath Scope
- Why It Matters
- Common Board Trap
- Estimated Time
- Difficulty

The learner should never need to hunt for the basic framing.

## State Awareness Contract
The platform must remember, when feasible:
- last module
- scroll position
- filters
- notes
- pending reviews
- weak topics

The platform should feel continuous, not reset-happy.

## Feedback Loop Contract
Every meaningful action should generate feedback.

Examples:
- answer submitted
- mastery updated
- progress changed
- review scheduled

Without feedback, engagement collapses.

## Error-Centered Learning Contract
Incorrect answers are higher-value learning events than correct ones.

Every wrong answer must produce:
- an explanation
- why distractors are wrong
- linked remediation
- related follow-up questions or review queue

## Adaptive Learning Contract
The system should eventually adjust:
- difficulty
- pace
- topic order
- question type

Based on:
- fatigue
- accuracy
- time to answer
- recent performance

## Visual Language Contract
Typography:
- maximum 2 fonts
- readable line height
- 60-90 character reading width

Colors:
- green = mastered or correct
- red = unsafe or incorrect
- yellow = caution
- blue = informational
- purple = advanced or experimental

Do not overload colors with multiple unrelated meanings.

Icons:
- must use one consistent icon family
- must reinforce meaning, not decorate randomly

## Accessibility Contract
Must support:
- keyboard navigation
- screen readers
- scalable text
- contrast compliance
- reduced motion mode

## Stability Contract
Forbidden:
- layout jumping
- flashing
- inconsistent controls
- lost progress

Educational medical software must feel trustworthy before it feels impressive.

## Trust and Information Integrity Contract
Every route should expose or inherit:
- source transparency
- version tracking
- ABPath alignment
- review status visibility

Users must trust both the content and the platform behavior.

## Acceptance Gates
This contract is satisfied only when:
- every didactics route shows an orientation frame before the main body
- every selected tutorial or teaching session opens as a destination page
- every route preserves state on return unless intentionally reset
- every incorrect answer exposes explanation plus remediation
- AP versus CP scope is obvious within one viewport
- controls remain stable and predictable across the learning surface
