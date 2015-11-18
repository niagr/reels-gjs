var Controller = (function () {
    function Controller() {
        this.gui_controller = new GUIController.GUIController();
    }
    Controller.prototype.load_movies_from_dir = function (movie_dir) {
    };
    return Controller;
})();
var GUIController;
(function (GUIController_1) {
    var Lang = imports.lang;
    var Gtk = imports.gi.Gtk;
    var GUIController = (function () {
        function GUIController() {
            this.application = new Gtk.Application();
            this.application.connect('activate', Lang.bind(this, this.onActivate));
            this.application.connect('startup', Lang.bind(this, this.onStartup));
            this.signal_handlers = {};
        }
        GUIController.prototype.onActivate = function () {
            this.main_window.show_all();
        };
        GUIController.prototype.onStartup = function () {
            this.init_base_ui();
            this.main_window.connect('destroy', Lang.bind(this, this.onDestroy));
        };
        GUIController.prototype.onDestroy = function () {
            print("Destroying main window.");
        };
        GUIController.prototype.onMovieFolderButtonClicked = function () {
            this.fire('activate');
            this.fire('foo');
            var movie_folder_path = this.run_file_chooser();
            if (movie_folder_path == null) {
                print("Movie folder not chosen successfully");
            }
            else {
                print(movie_folder_path);
            }
        };
        GUIController.prototype.run_file_chooser = function () {
            var chooser = new Gtk.FileChooserDialog({
                title: "Select the directory with your movies",
                action: Gtk.FileChooserAction.SELECT_FOLDER,
                select_multiple: false,
                transient_for: this.main_window
            });
            chooser.add_button('Cancel', Gtk.ResponseType.CANCEL);
            chooser.add_button('Select Folder', Gtk.ResponseType.OK);
            var response = chooser.run();
            if (response == Gtk.ResponseType.OK) {
                var file = chooser.get_file();
                chooser.destroy();
                return file.get_path();
            }
            else {
                chooser.destroy();
                return null;
            }
        };
        GUIController.prototype.init_base_ui = function () {
            this.main_window = new Gtk.ApplicationWindow({
                application: this.application,
                title: 'Reels'
            });
            this.main_window.set_default_size(1200, 600);
            this.main_window.set_icon_name("totem");
            this.toolbar = new Gtk.Toolbar();
            var add_movie_folder_button = new Gtk.ToolButton();
            add_movie_folder_button.connect('clicked', Lang.bind(this, this.onMovieFolderButtonClicked));
            add_movie_folder_button.set_icon_name("list-add-symbolic");
            this.toolbar.insert(add_movie_folder_button, 0);
            var vbox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 0
            });
            vbox.pack_start(this.toolbar, false, false, 0);
            this.main_window.add(vbox);
        };
        GUIController.prototype.run = function (args) {
            this.application.run(args);
        };
        GUIController.prototype.connect = function (sig_name, handler_func) {
            if (typeof this.signal_handlers[sig_name] === 'undefined') {
                this.signal_handlers[sig_name] = [];
            }
            this.signal_handlers[sig_name].push(handler_func);
        };
        GUIController.prototype.disconnect = function (sig_name, handler_func) {
            var handler_list = this.signal_handlers[sig_name];
            for (var i in handler_list) {
                if (handler_list[i] === handler_func) {
                    handler_list.splice(i, 1);
                    break;
                }
            }
        };
        GUIController.prototype.fire = function (sig_name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var handlers = this.signal_handlers[sig_name];
            if (handlers) {
                for (var _a = 0; _a < handlers.length; _a++) {
                    var handler = handlers[_a];
                    handler.apply(void 0, args);
                }
            }
        };
        return GUIController;
    })();
    GUIController_1.GUIController = GUIController;
})(GUIController || (GUIController = {}));
var Lang = imports.lang;
var Gtk = imports.gi.Gtk;
var gui_controller = new GUIController.GUIController();
gui_controller.run(ARGV);
var TMDb;
(function (TMDb_1) {
    var API_KEY = '';
    var SEARCH_URL = "http://api.themoviedb.org/3/search/movie";
    var MOVIE_INFO_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID";
    var IMAGE_BASE_URL = "http://image.tmdb.org/t/p/";
    var CREDITS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/credits";
    var REVIEWS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/reviews";
    var GENRES_URL = "http://api.themoviedb.org/3/genre/list";
    var TMDb = (function () {
        function TMDb(api_key) {
            var _this = this;
            API_KEY = api_key;
            this.req_queue = [];
            this.req_count = 0;
            this.max_req_per_10_sec = 40;
            Util.setInterval(function () {
                _this.req_count = 0;
                _this.flush_req();
            }, 10 * 1000);
        }
        TMDb.prototype.flush_req = function () {
            while (this.req_count < this.max_req_per_10_sec && this.req_queue.length > 0) {
                this.req_count++;
                this.req_queue.pop()();
                print("queued request " + this.req_count + " flushed.");
            }
        };
        TMDb.prototype.register = function (func) {
            this.req_queue.push(func);
            this.flush_req();
        };
        TMDb.prototype.search_movie = function (qry_str, cb) {
            this.register(function () {
                function on_reply(resp) {
                    if (resp.results.length > 0) {
                        cb(resp.results[0]);
                    }
                    else {
                        cb("not found");
                    }
                }
                Util.getJSON(SEARCH_URL, {
                    api_key: API_KEY,
                    query: qry_str
                }, on_reply);
            });
        };
        TMDb.prototype.get_movie_info = function (id, cb) {
            this.register(function () {
                Util.getJSON(MOVIE_INFO_URL.replace("MOVIE_ID", id.toString()), {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    if ("id" in resp) {
                        cb(resp);
                    }
                    else {
                        cb("not found");
                    }
                }
            });
        };
        TMDb.prototype.get_credits = function (id, cb) {
            this.register(function () {
                Util.getJSON(CREDITS_URL.replace("MOVIE_ID", id.toString()), {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    if ("cast" in resp) {
                        cb(resp);
                    }
                    else {
                        cb("not found");
                    }
                }
            });
        };
        TMDb.prototype.get_genres = function (cb) {
            this.register(function () {
                Util.getJSON(GENRES_URL, {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    //            console.log("Got the fucking reply.");
                    //            console.log(resp);
                    if ("genres" in resp) {
                        cb(null, resp.genres);
                    }
                    else {
                        cb(Error("Could not get genres list from server."), null);
                    }
                }
            });
        };
        return TMDb;
    })();
    TMDb_1.TMDb = TMDb;
})(TMDb || (TMDb = {}));
var Util;
(function (Util) {
    var Lang = imports.lang;
    var GLib = imports.gi.GLib;
    function getJSON(url, args, callback) {
        var Soup = imports.gi.Soup;
        var soup_session = new Soup.Session();
        function stringify_args(args) {
            var arg_str = '';
            arg_str += '?';
            var first_arg = true;
            for (var arg in args) {
                if (!first_arg) {
                    arg_str += '&';
                }
                first_arg = false;
                arg_str += (arg + '=' + args[arg]);
            }
            return arg_str;
        }
        var arg_str = '';
        if (args) {
            arg_str = stringify_args(args);
        }
        var request = Soup.Message.new('GET', url + arg_str);
        soup_session.queue_message(request, function (soup_session, message) {
            if (message.status_code !== 200) {
                callback(null, new Error("Request failed."));
            }
            var json_obj;
            try {
                json_obj = JSON.parse(message.response_body.data);
            }
            catch (e) {
                callback(null, new Error("Could not parse reply."));
                return;
            }
            callback(json_obj, null);
        });
    }
    Util.getJSON = getJSON;
    function setInterval(callback, interval) {
        GLib.timeout_add(1, interval, callback);
    }
    Util.setInterval = setInterval;
})(Util || (Util = {}));
