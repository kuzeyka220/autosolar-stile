const SUPABASE_URL = "https://lnzvebfnqwlrwmlflayn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QEC-WwrOalqSyh_2Dg3ByA_qDZ8wcws";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const categoryData = {
  all: {
    title: "Все товары",
    description: "Стремянки и крепёж AUTOSOLAR."
  },

  "gaz-kuzov": {
    title: "Стремянки ГАЗ кузовные",
    description: "Кузовные стремянки и крепёж для автомобилей ГАЗ."
  },

  "gaz-ressor": {
    title: "Стремянки ГАЗ рессорные",
    description: "Рессорные стремянки для ГАЗель, Соболь и других моделей ГАЗ."
  },

  paz: {
    title: "Стремянки для ПАЗ",
    description: "Стремянки и крепёж для автобусов ПАЗ."
  },

  maz: {
    title: "Стремянки для МАЗ",
    description: "Стремянки и крепёжные элементы для грузовиков МАЗ."
  },

  uaz: {
    title: "Стремянки для УАЗ",
    description: "Стремянки для УАЗ, УАЗ Профи и других моделей."
  },

  zil: {
    title: "Стремянки для ЗИЛ",
    description: "Стремянки и крепёж для автомобилей ЗИЛ."
  },

  trailer: {
    title: "Стремянки для прицепов",
    description: "Стремянки, крепления и комплектующие для прицепов."
  },

  other: {
    title: "Другие товары",
    description: "Другие товары AUTOSOLAR."
  }
};

let allProducts = [];
let currentCategory = "all";
let currentSearch = "";

const productsGrid = document.querySelector("#productsGrid");
const catalog = document.querySelector("#catalog");
const catalogTitle = document.querySelector("#catalogTitle");
const catalogDescription = document.querySelector("#catalogDescription");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const searchResult = document.querySelector("#searchResult");
const emptyState = document.querySelector("#emptyState");

async function loadProducts() {
  if (!productsGrid) {
    console.error("Не найден #productsGrid. Проверь index.html.");
    return;
  }

  productsGrid.innerHTML = `
    <p class="catalog-loading">
      Загружаем каталог AUTOSOLAR...
    </p>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("title", {
      ascending: true
    });

  if (error) {
    console.error("Ошибка загрузки каталога:", error);

    productsGrid.innerHTML = `
      <p class="catalog-error">
        Каталог временно недоступен. Попробуйте обновить страницу позже.
      </p>
    `;

    return;
  }

  allProducts = data || [];
  renderProducts();
}

function renderProducts() {
  if (!productsGrid) {
    return;
  }

  const searchText = currentSearch.trim().toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    const categoryMatches =
      currentCategory === "all" ||
      product.category === currentCategory;

    const searchableText = [
      product.title,
      product.vendor_code,
      product.description,
      product.brand
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchMatches =
      searchText === "" ||
      searchableText.includes(searchText);

    return categoryMatches && searchMatches;
  });

  updateSearchResult(filteredProducts.length, searchText);

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = "";

    if (emptyState) {
      emptyState.classList.add("show");
    }

    return;
  }

  if (emptyState) {
    emptyState.classList.remove("show");
  }

  productsGrid.innerHTML = filteredProducts
    .map((product) => createProductCard(product))
    .join("");
}

function createProductCard(product) {
  const imageUrl = product.image_url || "images/no-image.jpg";
  const title = product.title || "Товар AUTOSOLAR";
  const brand = product.brand || "AUTOSOLAR";
  const article = product.vendor_code || "—";

  const wbUrl = product.wb_url ? product.wb_url.trim() : "";
  const ozonUrl = product.ozon_url ? product.ozon_url.trim() : "";

  const imageLink = wbUrl || ozonUrl || "";

  const imageContent = `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(title)}"
      loading="lazy"
    >
  `;

  const productImage = imageLink
    ? `
      <a
        class="product-card__image"
        href="${escapeHtml(imageLink)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Открыть товар «${escapeHtml(title)}»"
      >
        ${imageContent}
      </a>
    `
    : `
      <div class="product-card__image">
        ${imageContent}
      </div>
    `;

  const marketplaceButtons = `
    <div class="marketplace-buttons">
      ${
        wbUrl
          ? `
            <a
              class="marketplace-btn marketplace-btn--wb"
              href="${escapeHtml(wbUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Купить на WB
            </a>
          `
          : ""
      }

      ${
        ozonUrl
          ? `
            <a
              class="marketplace-btn marketplace-btn--ozon"
              href="${escapeHtml(ozonUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Купить на Ozon
            </a>
          `
          : ""
      }

      ${
        !wbUrl && !ozonUrl
          ? `
            <span class="marketplace-btn marketplace-btn--unavailable">
              Нет в наличии
            </span>
          `
          : ""
      }
    </div>
  `;

  return `
    <article class="product-card">
      ${productImage}

      <p class="product-card__brand">
        ${escapeHtml(brand)}
      </p>

      <h3 class="product-card__title">
        ${escapeHtml(title)}
      </h3>

      <p class="product-card__article">
        Артикул: ${escapeHtml(article)}
      </p>

      ${marketplaceButtons}
    </article>
  `;
}

function openCategory(category) {
  currentCategory = category;
  currentSearch = "";

  if (searchInput) {
    searchInput.value = "";
  }

  const data = categoryData[category] || categoryData.all;

  if (catalogTitle) {
    catalogTitle.textContent = data.title;
  }

  if (catalogDescription) {
    catalogDescription.textContent = data.description;
  }

  updateActiveCategoryCard(category);
  renderProducts();
  scrollToCatalog();
}

function updateActiveCategoryCard(category) {
  document
    .querySelectorAll(".category-card[data-category]")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.category === category
      );
    });
}

function updateSearchResult(count, searchText) {
  if (!searchResult) {
    return;
  }

  if (searchText) {
    searchResult.textContent =
      `По запросу «${currentSearch}» найдено товаров: ${count}`;

    searchResult.classList.add("show");
  } else {
    searchResult.textContent = "";
    searchResult.classList.remove("show");
  }
}

function scrollToCatalog() {
  if (!catalog) {
    return;
  }

  catalog.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    openCategory(button.dataset.category);
  });
});

const heroCatalogButton = document.querySelector("#heroCatalogButton");

if (heroCatalogButton) {
  heroCatalogButton.addEventListener("click", () => {
    openCategory("all");
  });
}

const showAllButton = document.querySelector("#showAllButton");

if (showAllButton) {
  showAllButton.addEventListener("click", () => {
    openCategory("all");
  });
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    currentCategory = "all";
    currentSearch = searchInput ? searchInput.value : "";

    if (catalogTitle) {
      catalogTitle.textContent = "Результаты поиска";
    }

    if (catalogDescription) {
      catalogDescription.textContent =
        "Поиск товаров AUTOSOLAR по названию, описанию, бренду и артикулу.";
    }

    updateActiveCategoryCard("all");
    renderProducts();
    scrollToCatalog();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value;

    if (currentSearch.trim()) {
      currentCategory = "all";

      if (catalogTitle) {
        catalogTitle.textContent = "Результаты поиска";
      }

      if (catalogDescription) {
        catalogDescription.textContent =
          "Поиск товаров AUTOSOLAR по названию, описанию, бренду и артикулу.";
      }

      updateActiveCategoryCard("all");
    }

    renderProducts();
  });
}

const resetFiltersButton = document.querySelector("#resetFiltersButton");

if (resetFiltersButton) {
  resetFiltersButton.addEventListener("click", () => {
    openCategory("all");
  });
}

loadProducts();