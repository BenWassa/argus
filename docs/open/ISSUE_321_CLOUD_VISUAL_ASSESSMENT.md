# #321 — Visual photo-classification assessment specification (future domain contract)

> **Status:** proposed assessment semantics only. No engine, UI, persistence, migrations or Test assets implemented. Owning integration: #296 shared staged Learn, #113 offline/storage, #276 permanent completion. Scientific/media authority: #141 and [image-source gate](ISSUE_321_CLOUD_SOURCE_RESEARCH.md). Content steps: [C1–C7](ISSUE_321_CLOUD_LESSONS.md).

## 1. Separate three claims, three records

| Claim / display language | Source of truth | May it be inferred from legacy records? |
| --- | --- | --- |
| **Cloud Vocabulary — historical Learned and Test** | Original cloud-genera topic, original ten Ci→full-name item IDs, completion, item evidence, history, dates, badge/award | This **is** the legacy record; never mutate its meaning |
| **Cloud Photo Lessons — Learned** | A versioned curriculum receipt with all seven required stages completed once | **No**. A vocabulary score cannot assert unseen photo recognition; retain old Learned state independently |
| **Cloud Photo Recognition — verified evidence** | Optional real photographic Tests, using independently reviewed heldouts and multiple distinct correct photo events for every genus | **No**. Neither lesson choices nor vocabulary Test can create photo-recognition evidence |

Keep one recognizable Clouds topic/entry in the Library; internally distinguish the vocabulary and visual competences. A second catalog row, duplicate course, new required badge criterion or legacy item remap requires explicit product review. Do not change existing cloud-genera item prompt/answer, history score denominators, account isolation, role award rules, timestamps, records or original scope silently. Existing awards never revoke because new visual curriculum is added.

**Learning permanence:** finishing seven lessons once makes the visual curriculum Learned without Test, streak or later revisit. Historic vocabulary Learned remains Learned even if the visual curriculum is unstarted. A later miss on either Test does not demote either completion.

## 2. Data relationships: design only, not current TypeScript

- **GenusConcept**: stable WMO genus ID (Ci, Cc, Cs, Ac, As, Ns, St, Sc, Cu, Cb), full name, WMO source/version, positive diagnostic cues, confusable IDs and exclusion/ambiguity notes.
- **PhotoVariant**: stable assetId; genusId; canonical original and derivative content hashes; source URL, author, license and creator credit; sourceLineageId; photoEventId; unaltered-original ID; image width/height; manifestation/sky context; review receipts; datasetVersion; **exposure = learn | holdout**.
- **LessonStep**: immutable content ID, curriculumVersion, concept ID(s), authored feedback, *allowlisted exposed assetId*, prompt mode image→full genus and taught alternatives. A lesson step may write only stage progress.
- **PhotoTestSitting**: formatVersion, datasetVersion, sittingId, timestamp (historical record only, never used to schedule), separately recorded 10 concept-level questions, each with genusId, heldout assetId, chosen genusId, exact correctness, offered options, result and any accessibility-assistance marker.
- **PhotoRecognitionEvidence**: per genus, set of distinct **correct heldout photoEventIds/assetIds**, qualified under reviewed dataset/version and same response-assistance policy; plus auditable sitting refs. A second crop or near-duplicate of an event is not distinct evidence. No learning/Reference events enter this store.

Do not reuse ordinary text-based item IDs for photos. Exactly ten canonical genus concepts represent the category bank; 80 photographs are **stimulus variants**, not 80 separate memorization facts. Stable photo IDs must not reveal genus in any learner-facing Test surface (files and bundled URLs are not a high-security secrecy mechanism).

## 3. Test eligibility and sampling

**Hard gate:** scored photo recognition remains disabled until all ten genera have at least eight separately accepted real photos, at most three ever exposed, five still unexposed, independently verifiable rights/classification, two source lineages, three manifestations and correct offline assets; full dataset and contract sign-off. A Commons candidate/guide asset without the two independent scoring reviews is insufficient. The ordinary **Cloud Vocabulary Test** remains available and truthfully labeled.

**Proposed sitting:** ten image-first questions, one per genus, shuffled order; each stimulus selected only from heldout asset IDs for its true genus. Four large full-name alternatives from actual plausible confusion sets (with broader taught options if fewer than four close confusables), no incorrect/made-up genus and no filename/abbreviation/credit/diagnostic text before answer. Do not let an answer in one question trivially eliminate the correct genus from subsequent questions; selection with replacement across *genera* for distractors is fine. One photo per genus per sitting gives a transparent 0–10 score, not 0–80. Separate practice/lesson results never inflate Test score.

**Sampling behavior:** prioritize unseen held-out event IDs per genus, then less-seen distinct approved assets, then previously seen heldouts for unlimited replay. Repeat a previously seen image when necessary but **never count it as new distinct-image recognition evidence**. Selection must be deterministic under seeded test fixtures, stable on refresh/resume, robust to cache failure and scoped to the correct account. Never permit a learn-exposed asset into formal sampling even when pool is low; fail closed and keep the vocabulary Test accessible.

**Eligibility for stronger “verified photo recognition” claim:** a recorded correct response to at least **two distinct independent heldout photo events per genus across optional photographic Test history**, with all ten genera represented (≥20 unique correct category/photo pairs overall). The two instances must be independent; two identical crops/burst frames do not qualify. This is a *minimum diversity evidence gate*, not an unqualified professional license or claim of universal field recognition. An independent product decision must still define any minimum sitting-level accuracy/passing rule before surfacing a “verified” status. Do **not** invent a 70/80/90% pass threshold or declare competency from the first 10/10 sitting. Display raw score and historical evidence separately.

**Scoring semantics:** exact WMO genus ID answer versus reviewed single genus. Blank/abandoned response is not “correct”; ambiguous input/image is excluded from the scored bank. Show the actual 10-item numerator/denominator and category-by-category result, with errors explained *after* submitting. Repeated sittings are honest history, not a best-score substitution for older attempts. Preserve original photographic Test meaning when dataset version changes; updated evidence eligibility must be explicit, reviewed and never erase history.

## 4. Leakage / validity controls

- Hard-coded disjoint exposed and holdout sets by original image/event identity. Local AVIF variants or edited crops inherit the same exposure. Changing exposure from heldout to Learn permanently retires that lineage from Test for any learner who could have encountered it.
- Do not render or enumerate heldout asset IDs in Reference, previews, lesson feedback, image search lists, example cards, demo accounts, docs screenshots shipped in app, or “next photo” teasers. The assessment pack may be available for offline use, but that is not a promise of secure exam anti-cheating; packaged static resources can be inspected.
- No baked-in genus label, watermark or answer in alt, filename displayed in UI, network error, caption, metadata tooltip or downloadable credit pre-answer. Attribution/license accessible after answering and in a static credits/legal reference that does not pair holdout class with item pre-answer.
- Compare complete source originals *and* derived assets with content hash, perceptual hash, manual contact sheets, uploader and photoEventId. Freeze train/holdout split before release. Rework all planned uses if a photoEventId was previously exposed.
- Avoid nuisance cues: camera style, geographic lighting, color, horizon, photo resolution, photographer, crop geometry or grey-vs-blue as the only target clue. Balance class distributions and use robust varied views.
- Expert reviewers independently approve each *actual rendered phone crop*, not just file page labels. If image genuinely admits multiple WMO genera or the necessary physical context is missing, exclude it as scored stimulus rather than guessing the answer.
- Use image failure/low bandwidth fallback that **does not secretly show a text clue with the correct genus and score it**. Retry/skip as unscored, preserving denominator and outcome accurately.

## 5. Accessibility and source display

On **unassisted visual** questions, alt text must be neutral (“Photograph of clouds; identify the genus”) rather than “Cirrostratus veil with halo”. Answer/explanatory alt text becomes available *after* response. For screen-reader users or people unable to discriminate the visual, supply an **assisted description mode** with a labelled, source-backed feature description, but record and display that it is *text-assisted* and do not count it toward **unaided photographic recognition**. Accessibility must never prevent Lesson Learned: accessible equivalent teaching and stages can complete the curriculum without requiring visual-scoring Test, which remains optional.

Large images retain enough context at 390px; controls are full readable names, at least 44px touch targets, viable at 320px and 200% text; no forced pinch zoom, mandatory gestures, color-only answer, mobile keyboard, visual overlays covering important cloud parts or horizontal overflow. 390px approval mockups belong to the UI owner gate; none generated/implemented in this research PR.

Visible photo credit needs author, license, license link, source and derivative notice for reused CC images. On scoring surfaces, move revealing metadata to a post-submission credit/detail surface without bypassing rights requirements. Resolve legal/credit presentation before using any particular image; do not merely hide attribution.

## 6. Data preservation and offline sync acceptance tests for #296 / #113

**Contract cases to automate downstream** (not tests implemented here):

1. Existing Cloud Vocabulary completed with score/time/role award → new photo curriculum unstarted; all old bytes/semantics survive reload, export/import, same-account sync and account switch. New course never resets original Learned.
2. Existing user has no photo curriculum → no fabricated photo Test or two-photo evidence. Even a perfect historical abbreviation score cannot qualify.
3. Seven distinct visual lesson receipts → visual Learned persists exactly once; replay and later photographic Test misses cannot unlearn. Early completion may coexist with optional Test not yet offered.
4. Formative choice, cue question, replay, Reference, preview, sample image and assisted description → no formal photo sitting/evidence; no vocabulary item history write.
5. Exactly ten genus-level photo Test prompts, with ten heldout assets → one actual score/denominator; no image bank inflation to 80.
6. Repeated correct same photo (or two crops in same photoEventId) → one independent evidence unit. Correct different approved holdout event → two. For claim eligibility require two distinct correct events **for each of ten genera**; another class cannot compensate for deficit.
7. A learned/heldout asset leak, rights withdrawal, unapproved image, revoked classification or dataset mismatch → no new Test sampling; history retained with its original dataset receipt and visible qualification caveat.
8. Full offline Test with prepackaged approved media; missing photo never silently awarded as correct; no reliance on Commons runtime URLs.
9. Concurrency, interrupted write, saved sitting resumption, mixed dataset versions, two devices and account isolation: union only valid evidence for the same account and scope; never mix events from different users to reach the gate.
10. Content validators detect overlapping photoEventIds across exposure pools, over-3 exposed or under-5 holdout, missing license/rights/reviewer/hash, image scoring of non-photographs or ambiguous photos, invalid options or incorrect WMO ID mapping.
11. Test credits and accessible mode never leak correct class before answering; assist-mode evidence remains distinct after export/import.

## 7. Open product/review decisions (must not be implemented by assumption)

- Single Clouds topic with an internal versioned photo sub-competence is preferred, but exact catalog/schema presentation and migration need owner approval coordinated with #296.
- Confirm what threshold (if any) beyond ≥2 distinct correct heldouts/genus authorizes the stronger verified indicator. The 80-photo *asset* gate and twenty distinct correct response *evidence* floor are different conditions.
- Specify precise policy for revoked images and how old valid real attempt history is annotated, not deleted.
- Approve 390px mockups and accessibility credit placement **before any UI work**.
- Do not unlock scored photographic Test until rights, source provenance, 80-photo diversity, independent QA, offline media and end-to-end integrity checks are actually verified.

**This PR intentionally has no runtime files, asset imports, interactive UI or tests.** It is a reviewable source/content contract for later gated integration.
