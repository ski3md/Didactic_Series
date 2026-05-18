# Next 100 Active-App Steps

## Summary

This roadmap shifts execution to the `src/` app that Vite actually serves. The first tranche is now complete: the active app lands on Home, exposes a first-class didactic lecture library, preserves the legacy granulomatous lecture deck as a separate route, and gives users direct lecture pathways from the landing page.

The remaining 90 steps are organized around high-yield pathology teaching surfaces rather than raw migration work. The goal is to make the active app the canonical learner experience and progressively absorb the imported lecture, tutorial, atlas, and curriculum assets into it.

## Tranche Map

### Tranche 1: Active-App Lecture Convergence

1. Default the active app to `Home` instead of the legacy lecture deck.
2. Add a first-class `Didactic Lectures` section to the active app.
3. Add a normalized lecture catalog utility inside `src/`.
4. Add session-based lecture library navigation intents.
5. Add a markdown renderer for imported transcripts inside the active app.
6. Build the active-app didactic lecture library view.
7. Preserve the original granulomatous lecture deck as a separate legacy route.
8. Add the didactic lecture route to the active sidebar.
9. Add direct lecture-pathway buttons to the landing page.
10. Ignore Playwright and test output artifacts in git.

### Tranche 2: Active-App Didactic Shell

11. Add a first-class `Pathology Curriculum` section to the active app.
12. Port the canonical curriculum registry into the active app shell.
13. Add curriculum filters for subspecialty, board priority, and promotion state.
14. Add curriculum drilldowns into didactic lectures.
15. Add curriculum drilldowns into tutorials.
16. Add curriculum drilldowns into atlas/image surfaces.
17. Add curriculum drilldowns into syllabus exploration.
18. Add curriculum readiness badges for lectures, tutorials, images, algorithms, and assessment.
19. Separate canonical modules from staged modules visually.
20. Make the active Home page point to the curriculum as the recommended learner path.

### Tranche 3: Foundations and Pattern Blocks

21. Add a `Foundations of Surgical Pathology` module to the active app.
22. Add a `Spindle Cell Differential` module surface.
23. Add a `Clear Cell Differential` module surface.
24. Add a `Papillary Lesion Differential` module surface.
25. Add a `Small Round Blue Cell Differential` module surface.
26. Add a `Necrosis and Inflammatory Mimics` module surface.
27. Add pattern-family chips and quick filters to the curriculum.
28. Add specimen-context chips and quick filters to the curriculum.
29. Add direct lecture links from pattern blocks.
30. Add direct tutorial links from pattern blocks.

### Tranche 4: Breast and Gynecologic Core

31. Add the breast core module to the active app curriculum.
32. Add breast lecture deep-links from the active curriculum.
33. Add breast tutorial deep-links from the active curriculum.
34. Add breast atlas/image deep-links from the active curriculum.
35. Add the gynecologic core module to the active app curriculum.
36. Add gynecologic lecture deep-links from the active curriculum.
37. Add gynecologic tutorial deep-links from the active curriculum.
38. Add gynecologic atlas/image deep-links from the active curriculum.
39. Add breast and gyn module summaries to Home recommendations.
40. Add a “start with breast/gyn” curriculum CTA for early high-yield boards review.

### Tranche 5: GU and Lower GI / Upper GI

41. Add the renal and testicular core module to the active app curriculum.
42. Add exact lecture targeting for `Renal Mass Evaluation`.
43. Add exact lecture targeting for `Testicular Mass Evaluation`.
44. Add the lower GU staged module to the active curriculum.
45. Add the upper GI staged module to the active curriculum.
46. Add the colorectal staged module to the active curriculum.
47. Add GI topic recommendations to the Home page.
48. Add GU topic recommendations to the Home page.
49. Add GU/GI lecture grouping in the active didactic lecture library.
50. Add GU/GI quick-launch buttons from the curriculum shell.

### Tranche 6: HPB, Thoracic, and Head & Neck / Endocrine

51. Add the hepatobiliary and pancreatic core module to the active curriculum.
52. Add exact lecture targeting for `Liver/Biliary Pathology: Core Principles`.
53. Add exact lecture targeting for `Pancreas Pathology: Core Principles`.
54. Add the thoracic core module to the active curriculum.
55. Add exact lecture targeting for `Lung Pathology: Core Principles`.
56. Add the head & neck / endocrine core module to the active curriculum.
57. Add exact lecture targeting for `Head & Neck Pathology: Core Principles`.
58. Add exact lecture targeting for `Thyroid Pathology: Core Principles`.
59. Add Home-level topic pathways for HPB, thoracic, and H&N/endocrine.
60. Add curriculum “open lectures” pathways for all three modules.

### Tranche 7: Skin, Soft Tissue / Bone, Neuropathology, Pediatrics

61. Add the skin / melanocytic staged module to the active curriculum.
62. Add the soft tissue / bone core module to the active curriculum.
63. Add the neuropathology core module to the active curriculum.
64. Add exact lecture targeting for `Neuropathology: Core Principles`.
65. Add the pediatric / placental staged module to the active curriculum.
66. Add skin and mesenchymal home recommendations.
67. Add neuro and pediatric home recommendations.
68. Add staging notices for incomplete modules.
69. Add “planned assets” badges to staged modules.
70. Add topic-specific CTA ordering for advanced modules.

### Tranche 8: Tutorials, Algorithms, and Syllabus

71. Add an active-app tutorials surface for promoted AP/CP material.
72. Add track filters for surgical pathology versus clinical pathology tutorials.
73. Add direct curriculum-to-tutorial routing.
74. Add a dedicated algorithm navigator to the active app.
75. Add algorithm grouping by subspecialty and pattern family.
76. Add direct curriculum-to-algorithm routing.
77. Add an active-app syllabus explorer shell.
78. Add direct curriculum-to-syllabus routing.
79. Add canonical-versus-staged notices to tutorial and algorithm surfaces.
80. Add topic chips for Home recommendations into tutorials and algorithms.

### Tranche 9: Atlas, Assessments, and CP

81. Add the active-app atlas shell for curated and promoted images.
82. Add exact atlas routing from curriculum modules.
83. Add curriculum routing into inflammatory mimic image sets.
84. Add a breast/gyn/GU/HPB/thoracic image-first browse mode.
85. Add CP modules to the active curriculum shell.
86. Add a clinical pathology filter to the curriculum.
87. Add a CP tutorial lane inside the active app.
88. Add mixed assessment entry points for AP/CP learners.
89. Add a lecture-to-case CTA for major modules.
90. Add a curriculum-to-assessment CTA for major modules.

### Tranche 10: Validation and Release Hardening

91. Add deterministic tests for Home lecture pathways.
92. Add deterministic tests for didactic lecture selection intents.
93. Add deterministic tests for curriculum-to-lecture drilldowns.
94. Add deterministic tests for active section routing.
95. Add deterministic tests for canonical/staged badges.
96. Add documentation for the active app versus legacy root app split.
97. Add docs for the lecture library architecture in `src/`.
98. Add docs for the curriculum architecture in `src/`.
99. Publish an active-app release checklist.
100. Freeze an active-app baseline after lecture, curriculum, tutorial, and atlas routing are all canonical.

## Tranche 1 Status

Tranche 1 is complete in code and verified by build. The remaining work is to commit the active-app changes and continue with Tranche 2, which should port the curriculum shell into `src/` rather than adding more features to the inactive root app.
