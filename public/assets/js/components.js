// Cart, Wishlist, Announcement Bar & Shared UI State

export function getCart() {
    try {
        const cart = localStorage.getItem('noire_cart');
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        return [];
    }
}

export function saveCart(cart) {
    localStorage.setItem('noire_cart', JSON.stringify(cart));
    updateCartBadge();
}

export function addToCart(productId, size = '100ml', quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.productId === productId && item.size === size);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ productId, size, quantity });
    }

    saveCart(cart);
    showToast(`Added to your collection`);
}

export function removeFromCart(productId, size) {
    let cart = getCart();
    cart = cart.filter(item => !(item.productId === productId && item.size === size));
    saveCart(cart);
}

export function updateQuantity(productId, size, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.productId === productId && item.size === size);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart(cart);
    }
}

export function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Wishlist Management
export function getWishlist() {
    try {
        const list = localStorage.getItem('noire_wishlist');
        return list ? JSON.parse(list) : [];
    } catch (e) {
        return [];
    }
}

export function toggleWishlist(productId) {
    let list = getWishlist();
    const index = list.indexOf(productId);
    if (index > -1) {
        list.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        list.push(productId);
        showToast('Added to wishlist');
    }
    localStorage.setItem('noire_wishlist', JSON.stringify(list));
    updateWishlistBadge();
    return list.includes(productId);
}

export function updateWishlistBadge() {
    const list = getWishlist();
    const count = list.length;
    document.querySelectorAll('.wishlist-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

export function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-gem"></i> <span class="toast-message"></span>`;
        document.body.appendChild(toast);
    }
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Navbar & Footer Injection
export function renderHeaderFooter(currentPage = '') {
    const headerHtml = `
    <div class="announcement-bar">
        AN EXQUISITE SCENT. AN UNFORGETTABLE PRESENCE.
    </div>
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-logo">NOIRÉ <span>Perfumes</span></a>
            <ul class="nav-menu">
                <li><a href="index.html" class="nav-link ${currentPage === 'home' ? 'active' : ''}">Home</a></li>
                <li><a href="shop.html" class="nav-link ${currentPage === 'shop' ? 'active' : ''}">Shop</a></li>
                <li><a href="shop.html?category=collections" class="nav-link ${currentPage === 'collections' ? 'active' : ''}">Collections</a></li>
                <li><a href="about.html" class="nav-link ${currentPage === 'about' ? 'active' : ''}">Our Story</a></li>
                <li><a href="contact.html" class="nav-link ${currentPage === 'contact' ? 'active' : ''}">Contact</a></li>
            </ul>
            <div class="nav-actions">
                <a href="shop.html" class="nav-action-icon" title="Search Catalogue">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </a>
                <a href="cart.html?tab=wishlist" class="nav-action-icon" title="Wishlist">
                    <i class="fa-regular fa-heart"></i>
                    <span class="wishlist-badge" style="display:none;">0</span>
                </a>
                <a href="cart.html" class="cart-icon-btn" title="Shopping Bag">
                    <i class="fa-solid fa-bag-shopping"></i>
                    <span class="cart-badge" style="display:none;">0</span>
                </a>
                <button class="mobile-menu-toggle" aria-label="Toggle Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>
        </div>
    </nav>
    `;

    const footerHtml = `
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <h3 class="nav-logo" style="font-size: 1.4rem; margin-bottom: 1rem;">NOIRÉ <span>Perfumes</span></h3>
                    <p>Crafting rare, uncompromising olfactory masterpieces for those who demand distinction and quiet luxury.</p>
                    <p class="demo-disclaimer">Prices displayed in PKR. Demo E-Commerce Atelier.</p>
                </div>
                <div class="footer-col">
                    <h3>Navigation</h3>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="shop.html">Shop Catalogue</a></li>
                        <li><a href="about.html">Our Story</a></li>
                        <li><a href="contact.html">Contact Atelier</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h3>Customer Support</h3>
                    <ul>
                        <li><a href="cart.html">Shopping Bag</a></li>
                        <li><a href="contact.html">Delivery Information</a></li>
                        <li><a href="contact.html">Bank Transfer Verification</a></li>
                        <li><a href="contact.html">Privacy Policy & Terms</a></li>
                    </ul>
                </div>
                <div class="footer-col footer-newsletter">
                    <h3>Enter the World of Noire</h3>
                    <p>Receive private invitations to new formulation releases and seasonal exhibitions.</p>
                    <form id="newsletter-form" onsubmit="event.preventDefault(); alert('Thank you for joining the NOIRÉ Inner Circle.'); this.reset();">
                        <input type="email" placeholder="Enter your email" required />
                        <button type="submit" class="btn-gold" style="padding: 12px 20px;">Join</button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 NOIRÉ PERFUMES. All rights reserved.</p>
                <p>Designed for Ultimate Luxury & Elegance</p>
            </div>
        </div>
    </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHtml);
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    // Mobile menu toggle
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            const icon = toggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        });
    }

    updateCartBadge();
    updateWishlistBadge();
}
