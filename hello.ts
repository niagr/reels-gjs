declare var imports, ARGV;
declare function print(str: string);

const Lang = imports.lang;
const Gtk = imports.gi.Gtk;

let gui_controller = new GUIController.GUIController();
gui_controller.run(ARGV);
