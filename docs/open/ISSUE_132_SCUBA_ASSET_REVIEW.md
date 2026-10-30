# #132 scuba reference asset review

> Status: candidate sourcing complete for all six items, acceptance preparation active, 2026-10-28. Authority: candidate inventory only; not mechanical certification or permission to publish. Human equipment-accuracy and phone-size acceptance remain pending for every item. Candidates are not integrated into the app runtime. Scope: the six original items in [#132](https://github.com/BenWassa/argus/issues/132), Learn/reference only.

## Recommendation

Use real photographs for all six items. Six locally staged candidates (SCUBA, BCD, SPG, LPI, DSMB, DPV) have verified Commons description-page author and license metadata; SCUBA and DSMB were added on 2026-10-28, the other four on 2026-10-15. The custom-image briefs for SCUBA and DSMB are retained below only as a fallback if the human review rejects the staged photographs. No SVGs, generated equipment, or runtime integration were created in this task. Do not close #132: human acceptance is not complete and nothing is wired into Learn.

The files in [`docs/open/assets/scuba-reference/`](assets/scuba-reference/) are review candidates, not accepted Learn content. They live under docs so the Vite public-file precache cannot silently deploy them. [`provenance.json`](assets/scuba-reference/provenance.json) records source pages, authors, licenses, download/original URLs, retrieval dates and source and downloaded SHA-256 hashes, bytes and downloaded dimensions. Preserve attribution with any eventual app display. These candidates retain visible real-world branding and do not yet meet an absolute brand-free interpretation of “manufacturer-neutral.” Their selection does not recommend a product.

## Six-item inventory

### BCD — strong candidate

[`bcd.jpg`](assets/scuba-reference/bcd.jpg): [Buoyancy compensator.jpg](https://commons.wikimedia.org/wiki/File:Buoyancy_compensator.jpg), Malene Thyssen, selected license [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Visual inspection: isolated dark jacket on white, full outline and corrugated inflator assembly visible. Best of the reviewed BCD photographs for phone-size identity. Accessories in pockets and visible branding add distraction. A reviewer must confirm this older example is appropriate for the broad recreational reference and that small details are not mistaken for required equipment. Do not imply this is the only BCD form; backplate/wing configurations also exist.

### SPG — usable candidate, composition improvement desirable

[`spg.jpg`](assets/scuba-reference/spg.jpg): [Submersible pressure gauge on short HP hose P8160037.jpg](https://commons.wikimedia.org/wiki/File:Submersible_pressure_gauge_on_short_HP_hose_P8160037.jpg), Peter Southwood, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Visual inspection: real analog gauge with bar markings, short high-pressure hose and end fitting, lying on gray stone. Gauge is at right with considerable empty background. Device identity is visible, but dial detail will be weak in a small card. This is a short-hose example, not a generic setup prescription. Human review must assess gauge/fitting legibility in the actual app; a future crop must preserve provenance and record the change and share-alike license.

### LPI — strong close-up candidate, requires BCD context

[`lpi.jpg`](assets/scuba-reference/lpi.jpg): [Power inflator valve head for buoyancy compensator P5240188.jpg](https://commons.wikimedia.org/wiki/File:Power_inflator_valve_head_for_buoyancy_compensator_P5240188.jpg), Peter Southwood, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Visual inspection: large black inflator valve head, oral mouthpiece, corrugated BCD hose end and metallic low-pressure connector. Much clearer at phone size than the numbered backplate/wing image rejected below. Some connected hose extends outside the frame. Pair with the BCD reference so learners understand the assembly belongs to the BCD; do not present it as a generic hose or imply controls are identical across models. Human reviewer must confirm broad identity and that the framing is sufficient.

### DSMB — usable candidate, delayed-deployable identity needs human confirmation

[`dsmb.jpg`](assets/scuba-reference/dsmb.jpg): [Surface Marker Buoy Jacqui.JPG](https://commons.wikimedia.org/wiki/File:Surface_Marker_Buoy_Jacqui.JPG), Mark.murphy, selected license [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) (Commons also lists the GFDL). Commons file at original size, 913 × 721; no larger source exists.

Visual inspection: a fully inflated, bright orange elongated tube held at the surface by a diver, filling most of the frame width against dark blue water. The closed upper end and a round fitting near the diver's end are visible, and “DECO” is printed on the far end, which supports the decompression/delayed-buoy reading. The tube lies horizontally in the diver's arms rather than standing upright as it would once released, and the lower opening, line and reel/spool are not visible. A manufacturer mark is legible on the fabric. At phone width the tube reads immediately as a surface marker sausage. A reviewer must confirm that this is a delayed-deployable (open-ended or valved, deployed from depth) buoy rather than a surface-only SMB, that the horizontal hold does not mislead, and that the identifiable person and visible branding are acceptable. The source is filed under Commons “Delayed surface marker buoys”, which is not by itself proof of type.

Rejected or runner-up DSMB candidates, all inspected:

- [Surface marker buoy.JPG](https://commons.wikimedia.org/wiki/File:Surface_marker_buoy.JPG), Mark.murphy, public domain: inflated orange tube on a plain floor with finger spool and line, the cleanest isolated view. Only 499 × 300, so too soft for the primary card; the best alternate if the reviewer prefers an isolated object with its spool.
- [DSC6538 (25548361837).jpg](https://commons.wikimedia.org/wiki/File:DSC6538_%2825548361837%29.jpg), Jon Rasmussen, public domain: genuine underwater deployment from the seabed, but the half-filled tube is folded into a V, which teaches a transient shape rather than the marker.
- [Surfacemarker.jpg](https://commons.wikimedia.org/wiki/File:Surfacemarker.jpg), Arjes, CC BY-SA 3.0: diver inflating the buoy underwater; partly inflated, green cast, 453 × 604.
- [GeoExpedidition Similan Dive Center divers at the Similan Islands.jpg](https://commons.wikimedia.org/wiki/File:GeoExpedidition_Similan_Dive_Center_divers_at_the_Similan_Islands.jpg), SIMILANSCUBA, CC BY-SA 3.0: tube is small and competes with a large yellow mooring buoy and waving divers.
- [Diver deploying a DSMB at boiler of Cape Matapan.jpg](https://commons.wikimedia.org/wiki/File:Diver_deploying_a_DSMB_at_boiler_of_Cape_Matapan.jpg) and [Diver deploying a decompression buoy while ascending from the wreck of the MV Treasure P9280256.jpg](https://commons.wikimedia.org/wiki/File:Diver_deploying_a_decompression_buoy_while_ascending_from_the_wreck_of_the_MV_Treasure_P9280256.jpg), Peter Southwood: the buoy itself is out of frame or not distinguishable; only reel and line context.
- Previously inspected and still rejected: [Deco buoy unfurled.jpg](https://commons.wikimedia.org/wiki/File:Deco_buoy_unfurled.jpg) (deflated, 500 × 375), [Deployed surface marker buoy.JPG](https://commons.wikimedia.org/wiki/File:Deployed_surface_marker_buoy.JPG) (tube lost at phone size), and [Bottom deployable surface marker bouy P9040105.jpg](https://commons.wikimedia.org/wiki/File:Bottom_deployable_surface_marker_bouy_P9040105.jpg) (furled package).

Fallback ChatGPT app brief, only if the human review rejects both staged photographs: “Create a realistic reference photograph of one inflated delayed surface marker buoy, upright against a plain light neutral background, with the lower attachment point and a short portion of attached line visible. Bright orange or red elongated fabric tube. Use a supplied real DSMB photograph as the structural reference. Preserve its actual seams, lower opening/valve and attachment geometry. No diver, deployment sequence, baked-in labels, invented controls, logos or safety instruction. Frame the whole tube large enough to recognize at phone size.” A qualified reviewer must compare output with real equipment before acceptance.

### DPV — strong contextual candidate

[`dpv.jpg`](assets/scuba-reference/dpv.jpg): [Gavin scooter dab.jpg](https://commons.wikimedia.org/wiki/File:Gavin_scooter_dab.jpg), Matthew Hoelscher, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/), originally [Flickr](https://www.flickr.com/photos/26395196@N00/2715048559/).

Visual inspection: foreground diver and large cylindrical scooter with guarded propeller end and handhold, second diver behind. The DPV occupies enough foreground to read at phone size. Blue water reduces contrast; visible DAB lettering remains. Human review must confirm it teaches broad DPV identity without implying handling/configuration instruction. It is a real product example, not an endorsement.

### SCUBA — strong system candidate, variant caveat

[`scuba.jpg`](assets/scuba-reference/scuba.jpg): [Travel diving harness P6045456.JPG](https://commons.wikimedia.org/wiki/File:Travel_diving_harness_P6045456.JPG), Peter Southwood, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Commons description: “Lightweight travel diving harness with wing buoyancy compensator … assembled with 15l steel cylinder and regulator set.”

Visual inspection: rear view of a complete assembled set laid flat on a plain dark green background. One cylinder strapped to a red wing BCD by two cam bands; cylinder valve and first stage at the top; hoses routed to a primary second stage (left), an alternate second stage on a yellow hose (right), an SPG (lower left) and the corrugated BCD inflator hose. Every main component is visible and separated, and the system reads as one unit at phone width. Caveats: this is a lightweight travel wing harness rather than the jacket-style BCD most recreational learners use, the cylinder wears a protective mesh net, small regulator branding is visible, and the harness is shown unworn so it gives no on-diver context. A reviewer must confirm that the wing variant is acceptable as the general SCUBA picture (the BCD card already shows a jacket), that hose routing and connections look correct, and that the image is not read as setup instruction.

Rejected or runner-up SCUBA candidates, all inspected:

- [Diving equipment.JPG](https://commons.wikimedia.org/wiki/File:Diving_equipment.JPG), Adiel lo, CC BY-SA 3.0: cylinder and jacket BCD standing together outdoors, the best jacket-style alternative, but second stages and SPG are hidden, fins dominate the foreground and BCD branding is prominent.
- [Aqua lung and bcd.JPG](https://commons.wikimedia.org/wiki/File:Aqua_lung_and_bcd.JPG), Mark Murphy, CC BY-SA 3.0: top-down jacket and regulator on a wooden floor; the cylinder is almost entirely hidden under the BCD.
- [Melkutin penkki.jpg](https://commons.wikimedia.org/wiki/File:Melkutin_penkki.jpg), MattiKatti, CC BY-SA 3.0: backplate and wing set on a bench; cylinder hidden behind the wing, busy forest background.
- [Diving - scubadiver.JPG](https://commons.wikimedia.org/wiki/File:Diving_-_scubadiver.JPG), Mark.murphy, public domain: worn set with cylinder visible, but drysuit and hood dominate and the regulator path is obscured.
- [Diver practises replacing their scuba unit.jpg](https://commons.wikimedia.org/wiki/File:Diver_practises_replacing_their_scuba_unit.jpg), Yu Diving, CC BY-SA 2.0: pool skill demonstration; implies a procedure and components overlap.
- Previously inspected and still rejected: [Scuba set with integral bag PA111753.JPG](https://commons.wikimedia.org/wiki/File:Scuba_set_with_integral_bag_PA111753.JPG) (cylinder obscured), [Scuba 01.jpg](https://commons.wikimedia.org/wiki/File:Scuba_01.jpg) (regulator only, no cylinder or BCD), and [Scuba Diver - Ahmad Faiz Mustafa.jpg](https://commons.wikimedia.org/wiki/File:Scuba_Diver_-_Ahmad_Faiz_Mustafa.jpg) (cylinder mostly hidden).

Fallback ChatGPT app brief, only if the human review rejects the staged photograph: “Using supplied reference photographs of one actual recreational open-circuit scuba set, create a clean realistic three-quarter side/rear equipment reference image showing the complete system together: one cylinder mounted to a BCD/harness, regulator first stage on the cylinder valve, actual hose routing and second-stage regulator. Plain neutral background, no labels or logos. Preserve the supplied equipment geometry and connections. Show all main components with enough separation to recognize on a phone. Do not invent fittings or provide a setup sequence.” Prefer a real photo whenever the generated connections cannot be independently verified.

## Accuracy comparison and remaining work

The [SCUBAPRO BCS manual](https://scubapro.johnsonoutdoors.com/sites/default/files/2022-09/sp_stek_manual_en_0.pdf) and [SCUBA FORCE wing manual](https://www.scubaforce.eu/Portals/0/PDF/SCUBA%20FORCE%20WINGS%20MANUAL%20EN%202024.pdf) are manufacturer references for BCD/inflator form and relationship. [DAN’s DSMB explanation](https://world.dan.org/alert-diver/article/popping-the-question-what-is-a-dsmb/) is the training reference for the distinction between an SMB and DSMB. These support the review criteria; a file-description match is not mechanical acceptance. A detailed manufacturer/manual comparison for each exact candidate and independent equipment review are still pending.

## Consolidated human acceptance entries

For each eventual asset, record reviewer, date, tested app build/commit, displayed size, source/reference checked, pass/fail and correction:

- [ ] SCUBA: complete system visible, no invented or obscured essential connections.
- [ ] BCD: component obvious; example/variant limitations clear.
- [ ] SPG: real dial, hose and fittings recognizable; no interpretation or setup instruction implied.
- [ ] LPI: recognizable BCD inflator assembly with sufficient hose/context.
- [ ] DSMB: delayed-deployable identity confirmed; target tube dominates framing.
- [ ] DPV: vehicle obvious and mechanically plausible; no operation/configuration claim.
- [ ] All six: actual phone-size clarity, branding decision, attribution and license links, Learn-only placement, unchanged Test boundary and safety limitations.

Keep these unchecked until the human session. Once the workstream is accepted and complete, move this sourcing closeout under `docs/closed/` and update links; retain an open maintained attribution contract if assets ship.
