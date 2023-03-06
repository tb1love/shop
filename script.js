"use strict";

let content = document.querySelector(".content");


let is_reg_flag = false;

let log_out_btn = document.querySelector(".log_out_btn");
log_out_btn.addEventListener("click", log_out);

let to_login_btn = document.querySelector(".to_log_btn");
to_login_btn.addEventListener("click", auth_form_wrap);

let select_category = document.querySelector(".select_category");

let to_main_btn = document.querySelector(".to_main_btn");
to_main_btn.addEventListener("click", add_content);

let login_btn = document.querySelector(".login_btn");
login_btn.addEventListener("click", log_in);

let to_reg_btn = document.querySelector("#to_reg_btn");
to_reg_btn.addEventListener("click", reg_form_wrap);


let reg_form = document.getElementById("reg_form");
reg_form.addEventListener("submit", registration);

let to_login = document.querySelector("#to_login");
to_login.addEventListener("click", auth_form_wrap);

let content_page = document.getElementById('content_page');

let to_basket_btn = document.querySelector('.to_basket_btn')

to_basket_btn.addEventListener('click', () => {
    clear_content()
    renderBasket()
})

let to_profile_btn = document.querySelector('.to_profile_btn')
to_profile_btn.addEventListener('click', () => {
    clear_content()
})

class LocalBasket {
    #currentBasket = { // # - приватное поле класса
        userId : null,
        cart : [
            // {id, title, quantity, price}
        ],
        serverSynced : false
    }

    constructor() {
        const currentBasket = localStorage.getItem('currentBasket')
        if (currentBasket) {
            localStorage.getItem('currentBasket')
        } else {
            this.#currentBasket = { // # - приватное поле класса
                userId : null,
                cart : [],
                serverSynced : false
            }
        }
    }

    async serverSync(id) {
        const result = await fetch(`https://dummyjson.com/carts/${id}`)
            .then(res => res.json())
        this.#currentBasket.userId = id
        if (result?.products) {
            result.products.forEach(item => {
                this.addItem(item)
            })
        }
        this.updateBasket()
    }

    changeServerSynced() {
        this.#currentBasket.serverSynced = true
        this.updateBasket()
    }

    updateBasket(newBasket) {
        localStorage.setItem('currentBasket', JSON.stringify(this.#currentBasket))
    }

    serverSynced() { // Синхронизирует корзину с dummyjson, если происходит авторизация пользователя
        // который лежит у них в базе данных
        this.#currentBasket.serverSync = true;
        this.updateBasket()
    }

    createLocalBasket(userId) { // Создаёт новую локальную корзину при login
        this.#currentBasket.userId = userId
        this.updateBasket()
    }

    deleteLocalBasket() { // Чистит локальную корзину
        this.#currentBasket.userId = null; // Убирает привязку к конкретному пользователю (допустим при logout)
        this.clearItems() // Чистит массив
        this.updateBasket()
    }

    addItem(newItem) { // Добавляем новый объект в корзину
        if (!newItem?.quantity) {
            newItem.quantity = 1;
        }
        const existingItem = this.#currentBasket.cart.find(item => item.id === newItem.id)
        if (!existingItem) {
            this.#currentBasket.cart.push(newItem)
        } else {
            existingItem.quantity++;
        }
        this.updateBasket()
    }

    getItems() { // Вытаскиваем из корзины
        return this.#currentBasket.cart
    }

    changeItemQuantity(id, newQuantity) { // Меняем количество предмета в корзине
        if (newQuantity === 0) {
            this.removeItem(id)
        }
        const item = this.#currentBasket.cart.find(item => item.id === id)
        item.quantity = newQuantity;
        this.updateBasket()
    }

    clearItems() { // Чистит корзину
        this.#currentBasket.cart.length = 0;
        this.updateBasket()
    }

    removeItem(id) { // Удаляет конкретный предмет в корзине
        this.#currentBasket.cart = this.#currentBasket.cart.filter(item => item.id !== id)
        this.updateBasket()
    }
}

async function renderAfterAuth(userData) { // Функция рендера, используем и после авторизации, и после регистрации
    localStorage.setItem('currentUser', JSON.stringify(userData))
    localBasket.deleteLocalBasket()
    await localBasket.serverSync(userData.id)
    localBasket.changeServerSynced()
    await fetch('https://dummyjson.com/products/categories')
        .then(res => res.json())
        .then((json) => get_category(json));
    add_content();
    to_login_btn.style.display = "none";
    select_category.style.display = "flex";
    to_main_btn.style.display = "inline";
    to_profile_btn.style.display = "inline";
    log_out_btn.style.display = "inline";
    to_basket_btn.style.display = "inline";
}

const localBasket = new LocalBasket() // Инициализация нашего контроллера для localStorage корзины

async function renderBasket() { // Рендерим корзину, после в неё рендерятся renderBasketItem'ы
    content_page.innerHTML += `
    <div class="container">
            <div id="basket_wrapper" class="basket_wrapper">
                <h3 style="margin-bottom: 16px">Your basket</h3>
            </div>
        </div>
    `
    const cart = localBasket.getItems()
    const basketWrapper = document.getElementById('basket_wrapper')
    let total = 0;
    if (cart.length <= 0) {
        basketWrapper.innerHTML = `<p>Cart is empty</p>`
    } else {
        cart.forEach(item => {
            basketWrapper.append(renderBasketItem(item))
            total += item.price;
        })
    }
    basketWrapper.innerHTML += `
        <p style="text-align: right" id="basket_total_price">Total: ${total}$</p>
    `
}

function updateBasketTotal() {
    const basketElement = document.getElementById('basket_total_price');
    const items = localBasket.getItems();
    let total = 0;
    for (const item in items) {
        total += items[item].price * items[item].quantity
    }
    console.log(total)
    basketElement.innerText = `Total: ${total}$`
}

function renderBasketItem(product) { // Рендерит предмет в корзину
    const item = document.createElement('div');
    const itemId = product.id
    console.log(itemId)
    item.classList.add('basket_item')
    item.id = `basket_item_${itemId}`
    item.innerHTML = `
        <p className="basket_item_title">${product.title}</p>
        <input type="number" id="q_${product.id}" className="basket_item_title" 
            onchange="onQuantityChange(${itemId}, ${product.total}, ${product.price})" 
            value="${product.quantity}" min="0" max="${product.total}" 
        />
        <p id="price_${product.id}" className="basket_item_title">
            ${parseInt(product.price) * parseInt(product.quantity)}$
        </p>
    `
    const quantity = document.getElementById(`q_${itemId}`)
    return item
}


function onQuantityChange(id, max, price) { // Функция для события onchange (изменение значения)
    const quantityInput = document.getElementById(`q_${id}`)
    if (quantityInput.value <= 0) {
        localBasket.removeItem(id)
        const element = document.getElementById(`basket_item_${id}`)
        element.remove()
    } else {
        if (quantityInput.value > max) quantityInput.value = max
        else quantityInput.value = parseInt(quantityInput.value)
        localBasket.changeItemQuantity(id, parseInt(quantityInput.value))
        const priceElement = document.getElementById(`price_${id}`)
        priceElement.innerText = `${price * quantityInput.value}$`
    }
    updateBasketTotal()
}

function renderProfile() {

}


function reg_form_wrap() {
    is_reg_flag = true;

    anti_wrap_auth_form();

    let registration_form = document.querySelector(".registration_form");
    registration_form.style.display = "block";
}

function anti_wrap_auth_form() {
    let login_form = document.querySelector(".login_form");
    login_form.style.display = "none";
}

function anti_wrap_reg_form() {
    let registration_form = document.querySelector(".registration_form");
    registration_form.style.display = "none";

}

function auth_form_wrap() {
    to_login_btn.style.display = "none";
    is_reg_flag = false;

    anti_wrap_reg_form();

    let login_form = document.querySelector(".login_form");
    login_form.style.display = "block";
}

async function log_in() {
    let auth_log = document.querySelector("#auth_log").value;
    let auth_pwd = document.querySelector("#auth_pwd").value;

    const result = await fetch('https://dummyjson.com/auth/login', {
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({
            username : auth_log,
            password : auth_pwd,
        })
    }).then(res => res.json())
    const localCreatedUsersParsed = JSON.parse(localStorage.getItem('localCreatedUsers'));
    const isLocallyExists = localCreatedUsersParsed.find(user => user.username === auth_log && user.password === auth_pwd)
    console.log(isLocallyExists)
    if (result.token || isLocallyExists) { // Если ответ содержит токен, то мы использовали правильные данные
        anti_wrap_auth_form();
        renderAfterAuth(result)
    } else {
        alert('Invalid username or password')
    }
}


async function registration(e) {
    e.preventDefault()
    const username = document.getElementById('reg_log').value
    const password = document.getElementById('reg_pwd').value
    const result = await fetch('https://dummyjson.com/users/add', {
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({
            username,
            password
        })
    }).then(res => res.json())
    const localCreatedUsersParsed = JSON.parse(localStorage.getItem('localCreatedUsers'))
    if (!localCreatedUsersParsed) {
        localStorage.setItem('localCreatedUsers', JSON.stringify([result]))
        anti_wrap_reg_form()
        renderAfterAuth(result)
    } else {
        if (!localCreatedUsersParsed.find(user => user.username === username)) {
            localStorage.setItem('localCreatedUsers', JSON.stringify([...localCreatedUsersParsed, result]))
            anti_wrap_reg_form()
            renderAfterAuth(result)
        } else {
            alert('User is already local created')
        }
    }
}


function log_out() {
    to_login_btn.style.display = "inline-block";
    log_out_btn.style.display = "none";
    select_category.style.display = "none";
    to_main_btn.style.display = "none";
    to_profile_btn.style.display = "none";
    to_basket_btn.style.display = "none";
    localBasket.deleteLocalBasket()
    clear_content();
    localStorage.removeItem('currentUser')
}


function add_content() {
    clear_content();
    fetch('https://dummyjson.com/products')
        .then((response) => response.json())
        .then((json) => add_products(json));
}

function add_product_in_html(all_products) {
    let i = 0;
    for (const product of all_products) {
        content.innerHTML += `
        <div class="item" id="${i}">      
            <div class="product">
                <div class="item_img">
                    <div class="price_conteiner">
                        <p class="item_price">${product.price}$</p>
                    </div>
                    <img src="${product["images"][0]}" alt="">
                </div>
                <div class="item_info">
                    <p class="item_header">${product.title}</p>
                    <p class="about_item">${product.description}</p>
                </div>
            </div>
            <div class="buy_btn_wrapper">
                <button href="#" class="buy_btn">Buy</button>
            </div>
        </div>`;
        i += 1;
    }
    let item = document.querySelectorAll('.item');
    for (let i = 0; i < item.length; i++) {
        let click_id = item[i].id;
        item[i].addEventListener('click', (e) => {
            let product_id = all_products[click_id].id;
            clear_content();
            add_info_about_product(product_id);
        });
    }
}

function add_products(json) {
    clear_content();
    let all_products = json.products;
    add_product_in_html(all_products);
}

function add_products_of_category(product_id) {
    let search_category;
    let all_categories_by_id = document.querySelectorAll('.option');
    for (let i = 0; i < all_categories_by_id.length; i++) {
        if (all_categories_by_id[i].htmlFor === product_id) {
            search_category = all_categories_by_id[i].outerText.toLowerCase();
        }
    }
    fetch('https://dummyjson.com/products/category/' + search_category)
        .then(response => response.json())
        .then((json) => add_products(json));
}

function get_category(json) {
    let all_categories = json;
    capitalize(all_categories);
    for (let i = 0; i < all_categories.length; i++) {
        select_category.innerHTML += `
        <input class="select_opt" name="category" type="radio" id="opt${i + 2}">
        <label for="opt${i + 2}" class="option">${all_categories[i]}</label>`
    }
    let cat = document.querySelectorAll('.select_opt');
    for (let i = 0; i < cat.length; i++) {
        if (i === 0) {
            cat[i].addEventListener('click', (e) => {
                add_content();
            });
        } else {
            cat[i].addEventListener('click', (e) => {
                let product_id = e.target.id;
                add_products_of_category(product_id);
            });
        }
    }
}

async function add_info_about_product(product_id) {
    let about_product_page = document.querySelector(".about_product_page");
    let url = 'https://dummyjson.com/products/' + product_id;
    const result = await fetch(url)
        .then(response => response.json())
    console.log(result)
    about_product_page.innerHTML = `
        <h1 class="title_product">${result.title}</h1>
        <div class="picture">
            <ul class="product_picture_selector">
                <li>
                    <img class="product_img" src="${result.images[0]}" alt="product_photo">
                </li>
            </ul>
        </div>
        <br>
        <p class="brand_of_product">Производитель: ${result.brand}</p>
        <br>
        <p class="description_of_product">${result.description}</p>
        <br>
        <p class="description_of_product">Рейтинг продукта: <span class="mark_product">${result.rating}&#9733;</span></p>
        <br>
    `;
    const buyButton = document.createElement('button')
    buyButton.classList.add('details_buy_btn')
    buyButton.innerText = `Купить за ${result.price}$`
    buyButton.addEventListener('click', () => localBasket.addItem(result))
    about_product_page.append(buyButton)
}


function capitalize(category) {
    for (let i = 0; i < category.length; i++) {
        let s = category[i]
        category[i] = s[0].toUpperCase() + s.slice(1);
    }

}


function clear_content() {
    let div2 = document.getElementById('about_product_page');
    while (content_page.firstChild) {
        content_page.removeChild(content_page.firstChild);
    }
    while (div2.firstChild) {
        div2.removeChild(div2.firstChild);
    }
}