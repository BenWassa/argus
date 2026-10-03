# Compact library review

**Status:** completed agent review pass, 2026-10-03. Release authorised by the owner’s instruction “review pass then run release”; deployment was pending when this record was written.
**Authority:** historical review evidence for #175 and #166. This records an agent source/code review performed at the owner’s request, not an independent professional certification or a claim that the owner personally read the diff. Maintained behaviour remains in [Compact library topics](../open/LIBRARY_COMPACT_TOPICS.md) and [Topic-page revamp](../open/TOPIC_PAGE_REVAMP.md).

## Scope and result

Reviewed the integrated change against current `origin/main`: compact topic prose, topic/reference presentation, ordered Test metadata and parsing, the one-clean-Test ladder and legacy progress, existing-library migrations, modal focus/history/scrolling, and production/demo build boundaries. No blocking code finding remains. The source review replaces the pending review step for this release under the owner’s explicit delegation; it does not waive future safety-content review.

All scored item wording, choices, source lists and existing reference structures remain unchanged by the compact-copy edits. Ordered Tests intentionally add order metadata; the topic-page prerequisite intentionally changes ordinary completion to one clean Test. Progressive acquisition/evidence gates remain separate. The former Primary Survey scope migrates only for unchanged catalog copies; custom scopes, edited decks, user-owned topics and learner progress remain guarded.

## Source checks and corrections

- **Primary Survey:** checked the priority sequence, treatment-before-advancing, reassessment and early escalation against [Resuscitation Council UK’s ABCDE approach](https://www.resus.org.uk/library/abcde-approach). Restored explicit regular reassessment alongside reassessment after intervention or a condition change. The visible boundary remains headings/order recall, not clinical or first-aid training; no thresholds, doses or treatment techniques were added.
- **Firearm Safety:** checked ACTS/PROVE, open-and-unloaded handover, direct-control limits and mechanical-safety caveats against the RCMP 2014 Student Handbook, pp. 21–22 and 49–50. The government download returned an HTML interstitial to the review tools, so the same dated handbook was read from the [instructor-hosted copy](https://certifiedfirearmsinstructors.ca/wp-content/uploads/2017/03/cfsc-student-handbook.pdf). Corrected the case to refuse a closed firearm explicitly and keep subsequent checking within training or qualified help. Scored handbook wording and its original source URL stay unchanged. The [RCMP report](https://rcmp.ca/en/corporate-information/publications-and-manuals/2025-commissioner-firearms-report) confirms the 2026 curriculum rollout; the topic remains pinned to 2014 wording.
- **Maritime lights/shapes:** checked retained sectors, state signatures, under-12-m Rule 27 exemptions, smaller shape allowances and Canadian cone/cylinder exceptions against the [Canadian Collision Regulations](https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1416/FullText.html), Rules 20–30 and Annex I. Missing signals remain non-evidence; recognition does not determine collision-avoidance actions or qualifications.
- **Signal flags:** checked the single-letter meanings against [NGA Pub. 102, revised 2020](https://msi.nga.mil/api/publications/download?key=16694273%2FSFH00000%2FPub102bk.pdf), printed pp. 21–22. Corrected the shortened Juliet comparison to retain dangerous cargo in the fire branch. Canonical scored/entry wording already had that qualifier and was left unchanged.

Regression checks protect Juliet’s qualifier and refusal of the closed handover. The focused catalog/flag suite passed before final release gating. The full release gate runs after merge on `main`, followed by version/tag publication and Firebase Hosting verification.

## Delivery context

Existing integration CI on `eadc255` passed 1,601 unit tests and all 348 applicable browser cases (16 intentional skips), plus typecheck/build and rules. The review corrections and additional regression assertion are subsequently checked through `npm run check`; those earlier counts are not substituted for the release run.

The production target is the existing `argus-b7a5a` Firebase Hosting site. Hosting deploy is required by the repository release recipe. Firestore rules, their renderer/template and indexes have not changed since v1.3.2, so there is no rules deployment in this release. Optional external hero artwork and colour experiments remain outside this release.
