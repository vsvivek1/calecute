/**
 * "DRAFT — to be reviewed by legal" banner, required on every GoldLelam
 * legal-content page (privacy, terms, refund, grievance) per the brief.
 */
export function DraftNotice() {
  return (
    <div className="draft-notice" role="note">
      DRAFT — to be reviewed by legal. Not yet a final, binding version.
    </div>
  );
}
