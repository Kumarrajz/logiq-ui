import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Base industrial styled Swal instance
const IndustrialSwal = Swal.mixin({
  customClass: {
    popup: 'pitti-swal-popup',
    title: 'pitti-swal-title',
    htmlContainer: 'pitti-swal-html',
    confirmButton: 'btn-apple-base btn-apple-primary pitti-swal-btn',
    cancelButton: 'btn-apple-base btn-apple-nav pitti-swal-cancel-btn',
  },
  buttonsStyling: false,
  background: '#FFFFFF',
  color: '#0F172A',
});

export function showSuccess(title: string, htmlOrText?: string) {
  return IndustrialSwal.fire({
    icon: 'success',
    title,
    html: htmlOrText,
    confirmButtonText: '✓ Acknowledged',
  });
}

export function showError(title: string, htmlOrText?: string) {
  return IndustrialSwal.fire({
    icon: 'error',
    title,
    html: htmlOrText,
    confirmButtonText: 'Dismiss',
  });
}

export function showWarning(title: string, htmlOrText?: string) {
  return IndustrialSwal.fire({
    icon: 'warning',
    title,
    html: htmlOrText,
    confirmButtonText: 'Understood',
  });
}

export function showInfo(title: string, htmlOrText?: string) {
  return IndustrialSwal.fire({
    icon: 'info',
    title,
    html: htmlOrText,
    confirmButtonText: 'OK',
  });
}

export async function showConfirm(
  title: string,
  text: string,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel'
): Promise<boolean> {
  const res = await IndustrialSwal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return res.isConfirmed;
}

export function showHelpModal() {
  return IndustrialSwal.fire({
    title: 'Pitti Engineering Help & Technical Support',
    html: `
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #334155; margin-top: 10px;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 10px; margin-bottom: 12px;">
          <div style="font-weight: 700; color: #0B192C; font-size: 14px; margin-bottom: 4px;">
            Shopfloor Digital Logbook v1.0 (Production Edition)
          </div>
          <div style="color: #64748B; font-size: 12px;">
            Designed for Press Shop & Notching, Machine Utilisation, DPRs, and Enterprise Quality Inspections.
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-weight: 700; color: #0F172A; margin-bottom: 6px;">IT Support & Plant Helpline:</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>• <strong>Corporate IT Desk:</strong> +91 40 2331 2774</div>
            <div>• <strong>Plant-V Floor Dispatch:</strong> Ext. 5446 / 5447</div>
            <div>• <strong>Email Support:</strong> <span style="color: #1E60D5; font-weight: 600;">it.support@pitti.in</span></div>
          </div>
        </div>

        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; padding: 10px 12px; border-radius: 8px; font-size: 12px; color: #1E40AF;">
          <strong>Zero-Downtime Offline Guarantee:</strong> Entries made while disconnected from the plant network are safely cached locally in Dexie IndexedDB and will auto-sync once network reconnects.
        </div>
      </div>
    `,
    confirmButtonText: '✓ Close Help Guide',
    showCloseButton: true,
  });
}
