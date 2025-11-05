document.addEventListener('DOMContentLoaded', () => {
  // Filter functionality
  const filterButtons = document.querySelectorAll('.filter-buttons .btn');
  const projectCards = document.querySelectorAll('.project-card-wrapper');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Filter projects
      projectCards.forEach(card => {
        const status = card.getAttribute('data-status');

        if (filter === 'all' || status === filter) {
          card.style.display = 'block';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';

          // Animate in
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 100);
        } else {
          // Animate out
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '0';
          card.style.transform = 'translateY(-20px)';

          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Add smooth scroll behavior for project cards
  projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
  });

  // Add click animation for project cards
  const projectLinks = document.querySelectorAll('.project-card-link');
  projectLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const card = link.querySelector('.project-card');
      if (card) {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      }
    });
  });
});
