import backIconUrl     from '@images/back.svg'
import previousIconUrl from '@images/previous.svg'
import nextIconUrl     from '@images/next.svg'

export default function PlayerFooter({ onBack, onPrevious, onNext, hasPrevious, hasNext }) {
  return (
    <div className="player-footer">
      <button className="footer-btn footer-btn-light" onClick={onBack} title="Liste des leçons">
        <img src={backIconUrl} alt="Retour" className="footer-icon-dark" />
      </button>

      <div className="footer-right">
        {hasPrevious && (
          <button className="footer-btn footer-btn-light" onClick={onPrevious} title="Leçon précédente">
            <img src={previousIconUrl} alt="Précédent" className="footer-icon-dark" />
          </button>
        )}
        {hasNext && (
          <button className="footer-btn footer-btn-primary" onClick={onNext} title="Leçon suivante">
            <img src={nextIconUrl} alt="Suivant" className="footer-icon-light" />
          </button>
        )}
      </div>
    </div>
  )
}
