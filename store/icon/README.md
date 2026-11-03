# Orca Glass icon
Updated: 2026-11-03

## Selected and saved

User explicitly selected **orca-glass-icon-preview.png**, the earlier design,
not v2. Its matching native **orca-glass-icon.png** was saved to Even Hub using
the CLI icon update; success returned and the refreshed portal visibly shows
the selected icon with App icon checked complete. Editable source:
`orca-glass-icon.xcf`. No review submission, publication or beta change.

The studies below are retained as design history; their pending statuses are
superseded by this selection.

## Alternative study: user's no-glasses XCF

The user supplied `orca-glass-no-glasses.xcf` as the new starting point. This
26 × 24 source is retained unchanged. GIMP produced:

- `orca-no-glasses-cleaned.xcf` and `.png`: cleaned 26 × 24 silhouette, with
  transparent background and opaque #F4F4F4 artwork. The XCF retains a hidden
  source layer. This detailed version does **not** meet the portal dimensions.
- `orca-glass-icon-v2.xcf` and `.png`: simplified no-glasses 24 × 24 candidate,
  traced on the required effective 12 × 12 grid. Preserves the tail, dorsal fin,
  eye patch and white lower jaw. No glasses added.
- `orca-no-glasses-cleaned-preview.png` and `orca-glass-icon-v2-preview.png`:
  nearest-neighbour enlargements for review.

The v2 PNG passes the local dimensions, file size, colour, alpha and complete
2 × 2 block checks. Both new XCFs are open in GIMP. User visual review is pending;
the portal remains unchanged. The gallery now presents this source and v2.

## Earlier bottom-left JPEG study

User selected the lower-left orca with glasses from their supplied four-design
JPEG. Edited in installed **GIMP 3.2.6**, through its Python-Fu API. No image
generation or external pixel editor was used. The original JPEG was not changed.

## Files

- `orca-master.xcf`: editable 731 × 731 GIMP master. The original crop is kept
  as a hidden reference layer; the cleaned artwork is a separate visible layer.
- `orca-master.png`: cleaned artwork, with the grid/background removed and
  transparent negative space. Thin grid seams in the white art were closed.
- `orca-glass-icon.xcf`: editable 24 × 24 candidate, with a 2-pixel GIMP grid.
- `orca-glass-icon.png`: selected Even Hub icon, approved and saved to the portal.
- `orca-glass-icon-preview.png`: 16× nearest-neighbour enlargement on dark grey
  for review. Use the native 24 × 24 PNG for any eventual portal upload.

The master preserves the selected design. The small candidate simplifies the
outline and glasses because the required 2 × 2 blocks leave an effective 12 × 12
drawing grid. A direct reduction was too fragmented; the small version is a
pixel adaptation and must be reviewed separately from the master.

## Verification

PNG checked locally against installed Even Hub CLI rules: exactly 24 × 24,
under 1 MB, all visible pixels opaque #F4F4F4, all other pixels transparent,
and every lit cell in a complete aligned 2 × 2 block. Passed.

GIMP was opened with both XCF files from the repository's named Orca PowerShell
terminal `GIMP Icon Preview`. Existing portal placeholder remains unchanged.
No beta upload, review submission or public publication performed.
