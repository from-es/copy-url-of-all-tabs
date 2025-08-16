/**
 * selectTab(https://blog.25egg.com/?p=203)を jQuery 非依存に書き換え
 */
export function selectTab() {
	const selectors = {
		active    : "#setting",             // オプション画面読み込み時に表示する要素へのCSSセレクター
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