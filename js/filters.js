document.addEventListener('DOMContentLoaded', function () {
  const applyFiltersBtn = document.getElementById('applyFilters');
  const typeFilter = document.getElementById('typeFilter');
  const districtFilter = document.getElementById('districtFilter');
  const minPriceFilter = document.getElementById('minPrice');
  const maxPriceFilter = document.getElementById('maxPrice');
  const specialCards = document.querySelectorAll('#specials .col-md-4');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function () {
      const selectedType = typeFilter.value.toLowerCase();
      const selectedDistrict = districtFilter.value.toLowerCase();
      const minPrice = parseInt(minPriceFilter.value) || 0;
      const maxPrice = parseInt(maxPriceFilter.value) || Infinity;

      specialCards.forEach(card => {
        const cardType = card.getAttribute('data-type').toLowerCase();
        const cardDistrict = card.getAttribute('data-district').toLowerCase();
        const cardPrice = parseInt(card.getAttribute('data-price'));

        const typeMatch = !selectedType || cardType.includes(selectedType);
        const districtMatch = !selectedDistrict || cardDistrict.includes(selectedDistrict);
        const priceMatch = cardPrice >= minPrice && cardPrice <= maxPrice;

        if (typeMatch && districtMatch && priceMatch) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});
