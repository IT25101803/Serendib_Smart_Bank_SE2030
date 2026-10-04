import { useState, useRef, useEffect } from 'react';
import { README_ACCOUNTS, README_FIXED_DEPOSITS, README_LOANS_LEASING } from '../data/termsAndConditions';

interface TermsModalProps {
  type: 'ACCOUNTS' | 'FIXED_DEPOSITS' | 'LOANS';
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ type, isOpen, onClose, onAccept }: TermsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [accepted, setAccepted] = useState(false);

  const content = type === 'ACCOUNTS' 
    ? README_ACCOUNTS 
    : type === 'FIXED_DEPOSITS' 
      ? README_FIXED_DEPOSITS 
      : README_LOANS_LEASING;

  const title = type === 'ACCOUNTS'
    ? 'Savings & Current Accounts Legal Disclosures'
    : type === 'FIXED_DEPOSITS'
      ? 'Fixed Deposits Terms & Penalty Matrix'
      : 'Financing Disclosures & CRIB Consent Agreement';

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (accepted) {
      onAccept();
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="product-dialog terms-dialog"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <button className="dialog-close secondary" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2>{title}</h2>
      <div className="terms-body" style={{ maxHeight: '350px', overflowY: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: '1.5' }}>
          {content}
        </pre>
      </div>

      <div className="terms-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input
          type="checkbox"
          id="terms-check"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <label htmlFor="terms-check" style={{ cursor: 'pointer', fontSize: '0.92rem', fontWeight: 500 }}>
          I have read, understood, and explicitly agree to all Terms & Conditions, regulatory disclosures, and penalty matrices.
        </label>
      </div>

      <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={!accepted} onClick={handleConfirm}>
          Accept & Continue
        </button>
      </div>
    </dialog>
  );
}
