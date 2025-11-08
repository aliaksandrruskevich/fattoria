// Функция для загрузки данных сотрудников с логированием и проверками
async function loadTeamData() {
    console.log("loadTeamData started");
    const teamGrid = document.getElementById("teamGrid");
    const loadingIndicator = document.getElementById("loadingIndicator");

    if (!teamGrid) {
        console.error("Элемент с id 'teamGrid' не найден");
        return;
    }

    if (!loadingIndicator) {
        console.warn("Элемент с id 'loadingIndicator' не найден");
    } else {
        loadingIndicator.style.display = "block";
        console.log("loadingIndicator показан");
    }

    try {
        const response = await fetch('data/team.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const teamData = await response.json();
        console.log("Данные сотрудников загружены:", teamData);

        if (!loadingIndicator) {
            console.warn("Элемент с id 'loadingIndicator' не найден");
        } else {
            loadingIndicator.style.display = "none";
            console.log("loadingIndicator скрыт");
        }

        teamGrid.innerHTML = "";

        teamData.forEach((member, index) => {
            const memberElement = document.createElement("div");
            memberElement.classList.add("team-member");
            memberElement.setAttribute("data-aos", "fade-up");
            memberElement.setAttribute("data-aos-delay", index * 100);

            memberElement.innerHTML = `
                <img src="${member.photo}" class="team-member-img" alt="${member.name}">
                <div class="team-member-info">
                    <h3 class="team-member-name">${member.name}</h3>
                    <p class="team-member-position">${member.position}</p>
                    <div class="team-member-rating">
                        <i class="fas fa-star"></i> ${member.rating} (${member.reviews} отзывов)
                    </div>
                    <p class="team-member-specialization">${member.specialization}</p>
                    <button class="btn btn-outline-primary btn-sm">Подробнее</button>
                </div>
            `;

            memberElement.addEventListener('click', () => openMemberModal(member));
            teamGrid.appendChild(memberElement);
        });
        console.log("loadTeamData finished");
    } catch (error) {
        console.error("Ошибка загрузки данных сотрудников:", error);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<div class="text-center"><div class="spinner-border text-danger" role="status"><span class="visually-hidden">Ошибка загрузки...</span></div><p class="mt-2 text-danger">Ошибка загрузки данных о сотрудниках. Попробуйте перезагрузить страницу.</p></div>';
        }
    }
}

// Функция для открытия модального окна с информацией о сотруднике с логами
function openMemberModal(member) {
    console.log("openMemberModal called for", member.name);
    const modal = document.getElementById('teamMemberModal');
    if (!modal) {
        console.error("Модальное окно с id 'teamMemberModal' не найдено");
        return;
    }

    document.getElementById("modalAgentName").textContent = member.name;
    document.getElementById("modalAgentPosition").textContent = member.position;
    document.getElementById("modalAgentPhoto").src = member.photo;
    document.getElementById("modalAgentExperience").textContent = member.experience;
    document.getElementById("modalAgentRating").textContent = member.rating;
    document.getElementById("modalAgentReviews").textContent = member.reviews;
    document.getElementById("modalAgentAbout").textContent = member.about;
    document.getElementById("modalAgentSpecialization").textContent = member.specialization;
    document.getElementById("modalAgentRegions").textContent = member.regions;
    document.getElementById("modalAgentPhone").textContent = member.phone;

    document.getElementById("modalAgentWhatsApp").href = `https://wa.me/${member.phone.replace(/\D/g, '')}`;
    document.getElementById("modalAgentTelegram").href = member.telegram;
    document.getElementById("modalAgentViber").href = member.viber;
    document.getElementById("modalAgentProfile").href = member.profile;

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    console.log("Модальное окно открыто для", member.name);
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event fired");
    loadTeamData();
});
