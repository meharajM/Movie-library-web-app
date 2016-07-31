var App = {
	
	start: function(){
		App.editedMovies = {};
		if(App.getArchievedMovies()){
			App.editedMovies = App.getArchievedMovies();
		}
		if(App.getMovies()){
			App.Movies = App.getMovies();
			App.presentMovies = [];
			for(var i in App.Movies){
				App.presentMovies.push(App.Movies[i].Title.toLowerCase());
			}
		}
		else{
			App.Movies = {};
		}
		console.log("app started");
		this.movieModel = new App.movieModel;
		var movieview = new App.movieView({
			el: $('.js-app'),
			model: this.movieModel
		});		
		movieview.render();
		var filterview = new App.filterView({
			el: $('.searchFilter')
		});
	}
};
App.getArchievedMovies = function(){
	if(localStorage.getItem('archievedMovies')){
			return JSON.parse(localStorage.getItem('archievedMovies'));			
	}
	return false;
}
App.getMovies = function(){
	if(localStorage.getItem('movies')){
			return JSON.parse(localStorage.getItem('movies'));			
	}
	return false;
}
App.setArchievedMovies = function(){
	localStorage.setItem('archievedMovies',JSON.stringify(App.editedMovies));
}
App.setMovies = function(){
	localStorage.setItem('movies',JSON.stringify(App.Movies));
}
App.findMovie = function(name){
	if(App.presentMovies && App.presentMovies.indexOf(name.toLowerCase()) != -1 ){
		alert("already exist in library");
		return;
	}
	var self = this;
		self.movieModel.fetch({
			type: "GET",
			data:{
				t:name,
				plot:'short',
				r:'json'
			}
		}).done(function(){
			self.movieModel.trigger('change',self.movieModel);
		});
}
App.movieModel = Backbone.Model.extend({
	url: 'http://www.omdbapi.com/',
	parse: function(response){
		if(!response.Error){
			var title = response.Title;
			App.Movies[title] = response;
			App.setMovies();
			var filter = new App.filterView;
			filter.filterByGenre();
			App.presentMovies.push(title.toLowerCase());
		}else{
			alert('enter proper movie name');
		}
		$('#searchText').val('');
	}	
});

App.movieView = Backbone.View.extend({
	initialize: function(){
		this.listenTo(this.model,'change',this.render);					
	},
	events:{
		'click .movie' : 'editDetails'
	},
	render: function(){

		var template = _.template($('.tmpl-movie').html());
		var movies;
		if(App.isFilter){
			movies = App.filteredMovies;
		}else{
			movies = App.Movies;
		}
		this.$el.html(template({movies: movies}));
		return this;
	},
	saveEdited: function(ev){
		console.log(ev);
	},
	editDetails: function(ev){
		ev.stopPropagation();
		var editMovie = ev.currentTarget.id;
		editMovie = App.Movies[editMovie]
		this.showPopup(editMovie);
	},
	showPopup: function(movie){
		var template = _.template($('.popup-tpl').html());
		$('.edit-body').html(template({movie : movie}));
		$('#myModal').modal("show");
		$('#save').on('click',function(ev){
			ev.stopPropagation();
			if(this !== ev.currentTarget){
				return;
			}
			var title = $('.modal-box .title').text().trim();
			var year = $('.edit-details .year').val();
			var genre = $('.edit-details .genre').val();
			var actors = $('.edit-details .actors').val();
			var plot = $('.edit-details .plot').val();
			var rating = $('#rating').val();
			var movie = App.Movies[title]; 
			App.editedMovies[title] = _.clone(movie);
			movie.Year = year; 
			movie.Genre = genre;
			movie.Actors = actors;
			movie.Plot = plot;
			movie.imdbRating = rating;
			App.Movies[title] = movie; 
			App.setArchievedMovies();
			App.movieModel.trigger('change',self.movieModel);
			$('#myModal').modal('hide');
			return;
		});
		$('#reset').on('click',function(ev){
			ev.stopPropagation();
			if(this !== ev.currentTarget){
				return;
			}
			var title = $('.modal-box .title').text().trim();
			App.Movies[title] = App.editedMovies[title];
			App.movieModel.trigger('change',self.movieModel);
			$('#myModal').modal('hide');
			return;
		});
	}

});
App.filterView = Backbone.View.extend({
	initialize: function(){
		
	},
	events: {
		'keypress #searchText': 'searchMovie',
		'click .genre': 'filterByGenre'
	},
	initialize: function(){
		_.bindAll(this,'render','searchMovie');
	},
	searchMovie: function(ev){
		if(ev.which == 13){
				var searchText = ev.target.value.trim();
				if(!!searchText){
					App.findMovie(searchText);	
				}							
		}		
	},
	filterByGenre: function(ev){
		var genre;
		if(ev){
			genre = ev.target.innerText;
			$('.genre.selected').removeClass('selected');
			$(ev.target).addClass('selected');
		}else{
			genre = $('.genre.selected').text().trim();
		}
		
		if(genre == "All"){
			App.Movies = App.getMovies();
			App.isFilter = false;
		}else{
			App.isFilter = true;
			var movies = App.getMovies();
			App.filteredMovies = {};
			_.each(movies, function(movie){
				if(movie.Genre.indexOf(genre) != -1){
					App.filteredMovies[movie.Title] = movie;	
				}
			});						
		}
		App.movieModel.trigger('change',App.movieModel);
	},
	render: function(){
		console.log("render of filtr");
	}

});
(function(){
	App.start();

})();