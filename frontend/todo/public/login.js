const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

/* MOT DE PASSE VISIBLE OU NON */
document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    const isCurrentlyHidden = input.type === 'password';
    input.type = isCurrentlyHidden ? 'text' : 'password';

    const icon = btn.querySelector('i');
    if (icon) {
      // Quand le mot de passe est visible, l'icône "hide"
      if (isCurrentlyHidden) {
        icon.classList.remove('bx-show');
        icon.classList.add('bx-hide');
      } else {
        icon.classList.remove('bx-hide');
        icon.classList.add('bx-show');
      }
    }
    input.focus();
  });
});