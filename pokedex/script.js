document.addEventListener("DOMContentLoaded", function () {
  const pokemonList = document.getElementById("pokemonList");
  const paginationContainer = document.getElementById("pagination");
  const itemsPerPageSelect = document.getElementById("itemsPerPage");
  const searchInput = document.getElementById("searchInput");
  let itemsPerPage = parseInt(itemsPerPageSelect.value);
  let currentPage = 1;

  // Function to fetch data from the Pokémon API
  async function fetchData(url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  }

  // Function to fetch detailed information about each Pokémon, with evolution chain and breeding info
  async function fetchPokemonDetails(url) {
    try {
      const pokemonData = await fetchData(url);
      const speciesData = await fetchData(pokemonData.species.url); // Fetch species data for evolution and breeding info
      const evolutionChainData = await fetchEvolutionChain(
        speciesData.evolution_chain.url
      ); // Fetch evolution chain data
      const breedingData = speciesData;

      const pokemonElement = document.createElement("div");
      pokemonElement.classList.add("pokemon-card");
      pokemonElement.innerHTML = `
                <img src="${pokemonData.sprites.front_default}" alt="${
        pokemonData.name
      }">
                <h3>${pokemonData.name}</h3>
                <div class="details" style="display: none;">
                    <p>Height: ${pokemonData.height} dm</p>
                    <p>Weight: ${pokemonData.weight} hg</p>
                    <p>Base Experience: ${pokemonData.base_experience}</p>
                    <p>Abilities: ${pokemonData.abilities
                      .map((ability) => ability.ability.name)
                      .join(", ")}</p>
                    <p>Evolution Chain: ${evolutionChainData}</p>
                    <p>Breeding Information: ${getBreedingInfo(
                      breedingData
                    )}</p>
                </div>
                <button class="toggle-btn">Toggle Details</button>
            `;
      pokemonList.appendChild(pokemonElement);

      const toggleBtn = pokemonElement.querySelector(".toggle-btn");
      const details = pokemonElement.querySelector(".details");

      // Toggle details visibility on button click
      toggleBtn.addEventListener("click", function (event) {
        const parentCard = event.target.closest(".pokemon-card");
        const details = parentCard.querySelector(".details");
        details.style.display =
          details.style.display === "none" ? "block" : "none";
      });
    } catch (error) {
      console.log("Error fetching Pokémon details:", error);
    }
  }
  
  async function fetchEvolutionChain(url) {
    try {
      const evolutionChainData = await fetchData(url);
      const chain = [];
      const processChain = (chainData) => {
        chain.push(chainData.species.name);
        if (chainData.evolves_to.length > 0) {
          chainData.evolves_to.forEach((evolution) => {
            processChain(evolution);
          });
        }
      };
      processChain(evolutionChainData.chain);
      return chain.join(" -> ");
    } catch (error) {
      console.log("Error fetching evolution chain data:", error);
      return "N/A";
    }
  }

  function getBreedingInfo(speciesData) {
    try {
      const eggGroups = speciesData.egg_groups
        .map((group) => group.name)
        .join(", ");
      const genderRatioMale = speciesData.gender_rate * 12.5;
      const genderRatioFemale = (8 - speciesData.gender_rate) * 12.5;
      return `Egg groups: ${eggGroups}. Gender ratio: ${genderRatioMale}% male, ${genderRatioFemale}% female`;
    } catch (error) {
      console.log("Error processing breeding information:", error);
      return "N/A";
    }
  }

  // Function to display Pokémon for a specific page
  async function displayPokemon(page, itemsPerPage) {
    pokemonList.innerHTML = ""; // Clear the previous data
    const offset = (page - 1) * itemsPerPage;
    const apiUrl = `https://pokeapi.co/api/v2/pokemon?limit=${itemsPerPage}&offset=${offset}`;
    const data = await fetchData(apiUrl);

    if (data) {
      const pokemonArray = data.results;
      // Fetch details only for the visible Pokémon
      pokemonArray.forEach(async (pokemon, index) => {
        if (index < itemsPerPage) {
          await fetchPokemonDetails(pokemon.url);
        }
      });
    }
  }

  // Function to generate pagination links
  function generatePaginationLinks(totalPages) {
    paginationContainer.innerHTML = ""; // Clear previous pagination links
    for (let i = 1; i <= totalPages; i++) {
      const pageLink = document.createElement("span");
      pageLink.textContent = i;
      pageLink.classList.add("pagination-link");
      if (i === currentPage) {
        pageLink.classList.add("active");
      }
      pageLink.addEventListener("click", function () {
        currentPage = i;
        displayPokemon(currentPage, itemsPerPage);
        updatePaginationLinks(totalPages);
      });
      paginationContainer.appendChild(pageLink);
    }
  }

  // Function to update pagination links style
  function updatePaginationLinks(totalPages) {
    const pageLinks = document.querySelectorAll(".pagination-link");
    pageLinks.forEach((link) => {
      link.classList.remove("active");
      if (parseInt(link.textContent) === currentPage) {
        link.classList.add("active");
      }
    });
  }

  // Function to handle items per page change
  function handleItemsPerPageChange() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    currentPage = 1;
    displayPokemon(currentPage, itemsPerPage);
    generatePaginationLinks(Math.ceil(151 / itemsPerPage)); // Recalculate total pages
  }

  // Event listener for items per page change
  itemsPerPageSelect.addEventListener("change", handleItemsPerPageChange);

  // Function to handle search
  function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const pokemonCards = document.querySelectorAll(".pokemon-card");
    pokemonCards.forEach((card) => {
      const pokemonName = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = pokemonName.includes(searchTerm) ? "block" : "none";
    });
  }

  // Event listener for search input
  searchInput.addEventListener("input", handleSearch);

  // Initial function call
  displayPokemon(currentPage, itemsPerPage);
  generatePaginationLinks(Math.ceil(151 / itemsPerPage)); // Calculate total pages
});
