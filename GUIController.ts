module GUIController {

    declare var imports, ARGV;
    declare function print(str: string);

    const Lang = imports.lang;
    const Gtk = imports.gi.Gtk;

    export class GUIController {

        private application; // Gtk.Application
        private main_window; // Gtk.Window
        private toolbar; // Gtk.Toolbar
        private signal_handlers: {[signal_name: string]: Function[]}; // A map ["signal_name": handlers[]]


        constructor () {
            this.application = new Gtk.Application();
            this.application.connect('activate', Lang.bind(this, this.onActivate));
            this.application.connect('startup', Lang.bind(this, this.onStartup));
            this.signal_handlers = {};
        }

        private onActivate () {
            this.main_window.show_all();
        }

        private onStartup () {
            this.init_base_ui();
            this.main_window.connect('destroy', Lang.bind(this, this.onDestroy));
        }

        private onDestroy () {
            print("Destroying main window.");
        }

        private onMovieFolderButtonClicked () {
            this.fire('activate');
            this.fire('foo');
            let movie_folder_path = this.run_file_chooser();
            if (movie_folder_path == null) {
                print("Movie folder not chosen successfully");
            } else {
                print(movie_folder_path);
            }
        }

        private run_file_chooser () : string {
            // The FileChooserDialog:
    		let chooser = new Gtk.FileChooserDialog ({
    				title: "Select the directory with your movies",
                    action: Gtk.FileChooserAction.SELECT_FOLDER,
                    select_multiple: false,
                    transient_for: this.main_window
            });

            // Add the buttons and its return values
            chooser.add_button('Cancel', Gtk.ResponseType.CANCEL);
            chooser.add_button('Select Folder', Gtk.ResponseType.OK);
    		// get response and send command to controller thread
    		let response = chooser.run();
    		if (response == Gtk.ResponseType.OK) {
    			let file = chooser.get_file();
    			chooser.destroy();
                return file.get_path();
    		} else {
    			chooser.destroy();
                return null;
    		}
        }

        private init_base_ui () {
            this.main_window = new Gtk.ApplicationWindow({
                application: this.application,
                title: 'Reels'
            });
            this.main_window.set_default_size(1200, 600);
            this.main_window.set_icon_name("totem");

            // init main toolbar
            this.toolbar = new Gtk.Toolbar();

            // load movies button
            let add_movie_folder_button = new Gtk.ToolButton();
            add_movie_folder_button.connect('clicked', Lang.bind(this, this.onMovieFolderButtonClicked));
            add_movie_folder_button.set_icon_name("list-add-symbolic");
            this.toolbar.insert(add_movie_folder_button, 0);

            let vbox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 0
            });
            vbox.pack_start(this.toolbar, false, false, 0);
            this.main_window.add(vbox);
        }

        public run (args) {
            this.application.run(args);
        }

        public connect (sig_name: string, handler_func: Function) {
            if (typeof this.signal_handlers[sig_name] === 'undefined') {
                this.signal_handlers[sig_name] = [];
            }
            this.signal_handlers[sig_name].push(handler_func);
        }

        public disconnect (sig_name: string, handler_func: Function) {
            let handler_list = this.signal_handlers[sig_name];
            for (let i in handler_list) {
                if (handler_list[i] === handler_func) {
                    handler_list.splice(i, 1);
                    break;
                }
            }
        }

        private fire (sig_name: string, ...args) {
            let handlers = this.signal_handlers[sig_name];
            if (handlers) {
                for (let handler of handlers) {
                    handler(...args);
                }
            }
        }

    }

}
