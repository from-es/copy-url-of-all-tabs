/**
 * Module for handling tab switching on the options screen.
 *
 * selectTab (https://blog.25egg.com/?p=203) rewritten to be jQuery-independent.
 *
 * @file
 */

/**
 * Registers event handlers for tab switching on the options screen and activates the initial tab.
 *
 * @returns {void}
 */
export function selectTab(): void {
	const selectors = {
		active    : "#setting",             // CSS selector for the element to show when loading the options screen
		article   : "#contents > article",
		navigation: "#tabnav a",
	};

	const articles = document.querySelectorAll<HTMLElement>(selectors.article);
	const navLinks = document.querySelectorAll<HTMLAnchorElement>(selectors.navigation);

	const hideAllArticles = () => {
		articles.forEach(article => {
			article.style.display = "none";
		});
	};

	const handleNavClick = (event: MouseEvent) => {
		event.preventDefault();

		const target = event.currentTarget as HTMLAnchorElement;
		const hash = target.hash;

		navLinks.forEach(link => {
			link.classList.remove("active");
		});

		target.classList.add("active");

		hideAllArticles();

		const element = document.querySelector<HTMLElement>(hash);
		if (element) {
			element.style.display = "block";
		}
	};

	const activateInitialTab = () => {
		for (const link of navLinks) {
			if (link.hash === selectors.active) {
				link.click();
				break;
			}
		}
	};

	navLinks.forEach(link => {
		link.addEventListener("click", handleNavClick);
	});

	hideAllArticles();
	activateInitialTab();
}