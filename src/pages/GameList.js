import Page from './Page';
import GameThumbnail from '../components/GameThumbnail';
import Loader from '../components/Loader';
import Router from '../Router';
import Favoris from '../Favoris';

export default class GameList extends Page {
	#games;
	page_num;
	rendered_pages_num;
	rendered_games;
	constructor() {
		super('gameList');
		this.page_num = 1;
		this.rendered_pages_num = [];
		this.rendered_games = [];
		this.#games = [];
	}

	mount(element) {
		if (!this.rendered_pages_num.includes(this.page_num)) {
			this.rendered_pages_num.push(this.page_num);
			super.mount(element);
			this.element.innerHTML += new Loader().render();
			this.getGames();
		}
	}

	// Traite les infos recup sur l'api
	set games(value) {
		if (value.next == null) {
			document.onscroll = null;
		} else {
			this.page_num++;
			document.onscroll = this.loadMore;
		}
		this.#games = value.results;
		if (this.#games) {
			this.rendered_games.push(this.#games);
			if (this.children instanceof Array)
				this.#games.map(game => this.children.push(new GameThumbnail(game)));
			else this.children = this.#games.map(game => new GameThumbnail(game));
		}
	}

	// Reset la page
	resetPage() {
		this.rendered_games = [];
		this.rendered_pages_num = [];
		this.page_num = 1;
		super.resetPage();
	}

	// Permet le chargement de plus de jeux au scroll
	loadMore() {
		if (
			document.documentElement.scrollTop + window.innerHeight >=
			document.documentElement.scrollHeight - 5
		) {
			document.documentElement.scrollTop =
				document.documentElement.scrollTop - 5;
			Router.append('/');
		}
	}

	// Recupere la page de jeux sur l'api, render la page et initialise les listeners
	getGames() {
		fetch(
			`https://api.rawg.io/api/games?key=6b30690e274446c997ad25f8f19e1215&metacritic=50,100&dates=2020,${
				new Date().getUTCFullYear() + 1
			}&page=${this.page_num}`
		)
			.then(response => {
				if (response.status == 200) return response.json();
				else throw new Error(`Fetch error: ${response.status}`);
			})
			.then(responseJSON => {
				this.games = responseJSON;
				this.element.innerHTML = this.render();
				this.addFavorites(this.element);
				this.redirectDetails(this.element);
			})
			.catch(error => {
				console.error(error);
			});
	}

	// Listener ajout fav
	addFavorites(elt) {
		const thumbs = document.querySelectorAll('.gameThumbnail');
		thumbs.forEach(element => {
			const button = element.querySelector('.favbutton');
			button.addEventListener('click', e => {
				e.preventDefault();
				const name = element.querySelector('h4');
				this.rendered_games.forEach(games => {
					games.forEach(game => {
						if (game.name === name.innerHTML)
							Favoris.toggleFavoris(game, button);
					});
				});
			});
		});
	}

	// Listener redirection detail du jeu
	redirectDetails(elt) {
		document.querySelectorAll('.gameThumbnail').forEach(element => {
			element.querySelector('.card-content').addEventListener('click', e => {
				document.onscroll = null;
				Router.navigate(`/detail-${element.getAttribute('id')}`);
			});
			element.querySelector('img').addEventListener('click', e => {
				document.onscroll = null;
				Router.navigate(`/detail-${element.getAttribute('id')}`);
			});
		});
	}
}
