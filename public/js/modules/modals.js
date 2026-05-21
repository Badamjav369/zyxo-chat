const getE2EEOverlay = () =>
  document.getElementById('e2ee-modal-overlay');

export function openE2EEModal() {
  getE2EEOverlay().classList.add('visible');
}

export function closeE2EEModalBtn() {
  getE2EEOverlay().classList.remove('visible');
}

export function closeE2EEModal(event) {
  if (event.target.id !== 'e2ee-modal-overlay') {
    return;
  }

  closeE2EEModalBtn();
}