const switchBtn = document.getElementById('switchView');
const collectionView = document.getElementById('collectionView');
const boutiqueView = document.getElementById('boutiqueView');

/* PASSER DE BOUTIQUE A COLLECTION */
switchBtn.addEventListener('click', () => {
  if (collectionView.style.display !== 'none') {
    collectionView.style.display = 'none';
    boutiqueView.style.display = 'block';
    switchBtn.textContent = 'Collection de cartes';
  } else {
    /* ON REPASSE A LA VUE COLLECTION*/
    boutiqueView.style.display = 'none';
    collectionView.style.display = 'block';
    switchBtn.textContent = 'Acheter des coffres';
  }
});




