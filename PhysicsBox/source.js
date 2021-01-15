const possible_colours = [
	"rgb(214, 48, 49)",
	"rgb(9, 132, 227)",
	"rgb(0, 184, 148)",
	"rgb(253, 203, 110)",
	"rgb(108, 92, 231)",
	"rgb(255, 255, 255)"
];
const wall_thickness = 1000;

const canvas  = document.getElementById("canvas");
const context = canvas.getContext("2d");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

class Box {
	constructor (x, y, width, height, colour, options) {
		this.size = {
			width : width,
			height: height
		};

		this.colour  = colour;
		this.options = options;

		this.body = Matter.Bodies.rectangle(x, y, width, height, this.options);
	}

	draw () {
		context.fillStyle   = this.colour;
		context.shadowColor = this.colour;
		context.shadowBlur  = body_settings.glow_intensity;

		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		context.rotate(this.body.angle);
		context.fillRect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
		context.restore();
	}
}

let engine = Matter.Engine.create();
let world  = engine.world;


let drag_control = Matter.MouseConstraint.create(engine, {mouse: Matter.Mouse.create(canvas)});
Matter.World.add(world, [drag_control]);


let control_settings = {
	damping  : 0.1,
	stiffness: 0.01
}

let simulation_settings = {
	gravity: {
		strength: 0.001,
		x       : 0,
		y       : 1
	},
	time: {
		speed: 1
	}
}

let body_settings = {
	friction: {
		normal: 0.1,
		air   : 0.01,
		static: 0.5
	},
	restitution   : 0,
	glow_intensity: 0
}


const gui = new dat.GUI({
	autoPlace: false,
	width    : 750
});

const control_folder = gui.addFolder("Controls");
control_folder.add(control_settings, "damping"  , 0   , 1, 0.01).name("Damping: How rounded are sharp turns on the controls?");
control_folder.add(control_settings, "stiffness", 0.01, 1, 0.01).name("Stiffness: How springy or stiff are the controls?");
control_folder.open();

const properties_folder = gui.addFolder("Properties");
properties_folder.add(body_settings.friction, "normal"        , 0, 1 , 0.01).name("Friction: How much does it slow down during collisions?");
properties_folder.add(body_settings.friction, "air"           , 0, 1 , 0.01).name("Air Friction: How much does it slow down during flight?");
properties_folder.add(body_settings.friction, "static"        , 0, 10, 0.01).name("Static Friction: How much does it slow down over time?");
properties_folder.add(body_settings         , "restitution"   , 0, 1 , 0.01).name("Restitution: How many times & how high can it bounce?");
properties_folder.add(body_settings         , "glow_intensity", 0, 50, 1   ).name("Glow Intensity: How bright is it? ( Warning: Laggy! )");
properties_folder.open();

const gravity_folder = gui.addFolder("Gravity");
gravity_folder.add(simulation_settings.gravity, "strength",  0, 0.01, 0.0001).name("Strength: How strong is gravity in this simulation?");
gravity_folder.add(simulation_settings.gravity, "x"       , -1, 1   , 0.01  ).name("X: Which direction, if any, should horizontal gravity pull?");
gravity_folder.add(simulation_settings.gravity, "y"       , -1, 1   , 0.01  ).name("Y: Which direction, if any, should vertical gravity pull?");
gravity_folder.open();

const time_folder = gui.addFolder("Time");
time_folder.add(simulation_settings.time, "speed", 0.1, 1, 0.01).name("Speed: How slow is time in this simulation?");
time_folder.open();

document.getElementById("controls-container").appendChild(gui.domElement);


let bodies      = [];
let body_colour = possible_colours[Math.floor(Math.random() * possible_colours.length)];

let left_stack = Matter.Composites.stack((canvas.width / 2) - 450, canvas.height - 150, 5, 5, 0, 0, (x, y) => {
	let body = new Box(x, y, 30, 30, body_colour, {});
	bodies.push(body);
	return body.body;
});

let right_stack = Matter.Composites.stack((canvas.width / 2) + 300, canvas.height - 150, 5, 5, 0, 0, (x, y) => {
	let body = new Box(x, y, 30, 30, body_colour, {});
	bodies.push(body);
	return body.body;
});

let middle_stack = Matter.Composites.stack((canvas.width / 2) - 225, canvas.height - 450, 15, 15, 0, 0, (x, y) => {
	let body = new Box(x, y, 30, 30, body_colour, {});
	bodies.push(body);
	return body.body;
});

Matter.World.add(world, [
	new Box(canvas.width / 2                 , -wall_thickness / 2               , canvas.width + wall_thickness, wall_thickness                , "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Box(canvas.width / 2                 , canvas.height + wall_thickness / 2, canvas.width + wall_thickness, wall_thickness                , "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Box(-wall_thickness / 2              , canvas.height / 2                 , wall_thickness               , canvas.height + wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Box(canvas.width + wall_thickness / 2, canvas.height / 2                 , wall_thickness               , canvas.height + wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	left_stack,
	right_stack,
	middle_stack
]);


let clear_screen = () => {
	context.fillStyle = "rgb(45, 52, 54)";
	context.fillRect(0, 0, canvas.width, canvas.height);
}

let update_controls = () => {
	drag_control.constraint.damping   = control_settings.damping;
	drag_control.constraint.stiffness = control_settings.stiffness;
}

let update_bodies = (body) => {
	body.body.friction       = body_settings.friction.normal;
	body.body.frictionAir    = body_settings.friction.air;
	body.body.frictionStatic = body_settings.friction.static;

	body.body.restitution = body_settings.restitution;

	body.draw();
}

let update_gravity = () => {
	world.gravity.scale = simulation_settings.gravity.strength;
	world.gravity.x     = simulation_settings.gravity.x;
	world.gravity.y     = simulation_settings.gravity.y;
}

let update_iterations = () => {
	engine.constraintIterations = Math.round(2 / simulation_settings.time.speed);
	engine.positionIterations   = Math.round(6 / simulation_settings.time.speed);
	engine.velocityIterations   = Math.round(4 / simulation_settings.time.speed);
}


let game_loop = () => {
	window.requestAnimationFrame(game_loop);

	clear_screen();

	update_controls();
	update_gravity();
	update_iterations();
	bodies.forEach(body => update_bodies(body));

	Matter.Engine.update(engine, 16 * simulation_settings.time.speed);
}

game_loop();
