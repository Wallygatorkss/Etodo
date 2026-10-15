const API_URL = 'http://localhost:3001'; 
/* INSCRIPTION */
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstname = document.getElementById('firstname').value.trim();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  console.log("cacacaca")
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email , password , name , firstname})
    });

    const data = await response.json();
    if (response.ok) {
      alert('✅ Compte créé avec succès !');
      // Basculer vers connexion
      const container = document.getElementById('container');
      if (container) {
        container.classList.remove('right-panel-active');
      }
      // Pré-remplir l'email 
      const emailLoginInput = document.getElementById('mailco');
      if (emailLoginInput) {
        emailLoginInput.value = email;
        emailLoginInput.focus();
      }
    } else {
      alert('⚠️ Erreur : ' + data.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
});

/* LA CONNEXION */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('mailco').value.trim();
  const password = document.getElementById('mdpco').value.trim();
  console.log ("caca");

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    const data = await response.json();
    if (response.ok) {
      document.cookie = `token=${data.token}; path=/; SameSite=Lax;`;
      window.location.href = 'http://localhost:3000';
    } else {
      alert('❌ Email ou mot de passe incorrect');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
});
