/**
 * selectTab(https://blog.25egg.com/?p=203)を jQuery 非依存に書き換え
 */
export function selectTab() {
	const constant = {
		Active     : "#setting", // オプション画面読み込み時に表示する要素へのCSSセレクター
		Article    : "#contents > article",
		Navigation : "#tabnav a"
	};
	const hideArticle = () => {
		const article = document.querySelectorAll(constant.Article);

		(article).forEach(
			(elm) => {
				elm.setAttribute("style", "display: none;");
			}
		);
	};
	const addEvntAnchor = () => {
		const anchor = document.querySelectorAll(constant.Navigation);

		(anchor).forEach(
			(elm) => {
				elm.addEventListener("click",
					(ev) => {
						const hash = elm.hash;

						(anchor).forEach(
							(anc) => {
								anc.removeAttribute("class");
							}
						);
						elm.setAttribute("class", "active");

						hideArticle();
						(document.querySelector(hash)).setAttribute("style", "display: block;");

						// aタグの無効化 - preventDefaultとreturn falseの違いとか(https://qiita.com/kantaro7538/items/f3c6e2373c348ea74b19)
						ev.preventDefault();
					},
					false
				);
			}
		);
	};
	const activeArticle = () => {
		const anchor = document.querySelectorAll(constant.Navigation);

		for (let elm of anchor) {
			if ( elm.hash === constant.Active ) {
				elm.click();
				break;
			}
		}
	};

	hideArticle();
	addEvntAnchor();
	activeArticle();
}