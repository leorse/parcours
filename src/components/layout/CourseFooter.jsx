import backIconUrl from '@images/back.svg'

export default function CourseFooter({ onBack }) {
  return (
    <div className="course-footer">
      <button className="footer-btn footer-btn-dark" onClick={onBack} title="Retour aux cours">
        <img src={backIconUrl} alt="Retour aux cours" className="footer-icon-light" />
      </button>
    </div>
  )
}
