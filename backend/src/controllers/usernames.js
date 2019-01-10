/**
 * Created by b0913178 on 10/07/2017.
 */

let animals = ["Aardvark",
    "Anteater",
    "Antelope",
    "Arctic Fox",
    "Arctic Hare",
    "Arctic Wolf",
    "Armadillo",
    "Aye Aye",
    "Baboon",
    "Badger",
    "Bandicoot",
    "Bat",
    "Bear",
    "Beaver",
    "Bengal Tiger",
    "Binturong",
    "Bison",
    "Black Bear",
    "Blue Whale",
    "Bobcat",
    "Bongo",
    "Bonobo",
    "Bornean Orang-utan",
    "Borneo Elephant",
    "Brown Bear",
    "Buffalo",
    "Camel",
    "Capybara",
    "Caracal",
    "Cat",
    "Chamois",
    "Cheetah",
    "Chimpanzee",
    "Chinchilla",
    "Chipmunk",
    "Clouded Leopard",
    "Coati",
    "Collared Peccary",
    "Cougar",
    "Cow",
    "Coyote",
    "Cuscus",
    "Deer",
    "Dhole",
    "Dingo",
    "Dog",
    "Dolphin",
    "Donkey",
    "Dormouse",
    "Dugong",
    "Echidna",
    "Elephant",
    "Elephant Seal",
    "Elephant Shrew",
    "Emperor Tamarin",
    "Fennec Fox",
    "Ferret",
    "Fin Whale",
    "Fishing Cat",
    "Flying Squirrel",
    "Fossa",
    "Fox",
    "Fur Seal",
    "Gerbil",
    "Gibbon",
    "Giraffe",
    "Goat",
    "Gopher",
    "Gorilla",
    "Grey Seal",
    "Grizzly Bear",
    "Guinea Pig",
    "Hamster",
    "Hare",
    "Hedgehog",
    "Highland Cattle",
    "Hippopotamus",
    "Horse",
    "Howler Monkey",
    "Human",
    "Humpback Whale",
    "Hyena",
    "Impala",
    "Indri",
    "Jackal",
    "Jaguar",
    "Kangaroo",
    "Killer Whale",
    "Koala",
    "Kudu",
    "Lemming",
    "Lemur",
    "Leopard",
    "Leopard Cat",
    "Leopard Seal",
    "Liger",
    "Lion",
    "Llama",
    "Lynx",
    "Malayan Civet",
    "Malayan Tiger",
    "Manatee",
    "Mandrill",
    "Markhor",
    "Masked Palm Civet",
    "Meerkat",
    "Minke Whale",
    "Mole",
    "Mongoose",
    "Monkey",
    "Moose",
    "Mountain Gorilla",
    "Mountain Lion",
    "Mouse",
    "Mule",
    "Neanderthal",
    "Numbat",
    "Ocelot",
    "Okapi",
    "Opossum",
    "Orang-utan",
    "Otter",
    "Pademelon",
    "Panther",
    "Patas Monkey",
    "Pied Tamarin",
    "Pig",
    "Pika",
    "Platypus",
    "Polar Bear",
    "Porcupine",
    "Possum",
    "Proboscis Monkey",
    "Puma",
    "Quokka",
    "Quoll",
    "Rabbit",
    "Raccoon",
    "Raccoon Dog",
    "Rat",
    "Red Panda",
    "Red Wolf",
    "Reindeer",
    "Rhinoceros",
    "River Dolphin",
    "Rock Hyrax",
    "Sabre-Toothed Tiger",
    "Saola",
    "Sea Lion",
    "Sea Otter",
    "Seal",
    "Serval",
    "Sheep",
    "Siberian Tiger",
    "Skunk",
    "Sloth",
    "South China Tiger",
    "Spectacled Bear",
    "Sperm Whale",
    "Spider Monkey",
    "Squirrel",
    "Squirrel Monkey",
    "Sri Lankan Elephant",
    "Stellers Sea Cow",
    "Stoat",
    "Sumatran Tiger",
    "Sun Bear",
    "Tapir",
    "Tarsier",
    "Tasmanian Devil",
    "Tiger",
    "Uakari",
    "Vampire Bat",
    "Vervet Monkey",
    "Wallaby",
    "Walrus",
    "Warthog",
    "Water Buffalo",
    "Water Vole",
    "Weasel",
    "Western Gorilla",
    "White Rhinoceros",
    "White Tiger",
    "Wild Boar",
    "Wildebeest",
    "Wolf",
    "Wolverine",
    "Wombat",
    "Woolly Mammoth",
    "Woolly Monkey",
    "Yak",
    "Zebra",
    "Zebu",
    "Zonkey",
    "Zorse",
    "Alligator",
    "Bearded Dragon",
    "Caiman",
    "Caiman Lizard",
    "Chameleon",
    "Crocodile",
    "Desert Tortoise",
    "Frilled Lizard",
    "Galapagos Tortoise",
    "Gecko",
    "Gharial",
    "Gila Monster",
    "Glass Lizard",
    "Iguana",
    "Indian Star Tortoise",
    "Komodo Dragon",
    "Leaf-Tailed Gecko",
    "Leopard Tortoise",
    "Lizard",
    "Monitor Lizard",
    "Radiated Tortoise",
    "River Turtle",
    "Sand Lizard",
    "Sea Turtle",
    "Slow Worm",
    "Snapping Turtle",
    "Thorny Devil",
    "Tortoise",
    "Tuatara",
    "Water Dragon"];

let colours = ["Alizarin",
    "Amaranth",
    "Amber",
    "Amethyst",
    "Apricot",
    "Aqua",
    "Aquamarine",
    "Asparagus",
    "Auburn",
    "Azure",
    "Beige",
    "Bistre",
    "Black",
    "Blue",
    "Blue Green",
    "Blue Violet",
    "Bondi Blue",
    "Brass",
    "Bronze",
    "Brown",
    "Buff",
    "Burgundy",
    "Burnt Orange",
    "Burnt Sienna",
    "Burnt Umber",
    "Camouflage Green",
    "Caput Mortuum",
    "Cardinal",
    "Carmine",
    "Carrot orange",
    "Celadon",
    "Cerise",
    "Cerulean",
    "Champagne",
    "Charcoal",
    "Chartreuse",
    "Cherry Blossom Pink",
    "Chestnut",
    "Chocolate",
    "Cinnabar",
    "Cinnamon",
    "Cobalt",
    "Copper",
    "Coral",
    "Corn",
    "Cornflower",
    "Cream",
    "Crimson",
    "Cyan",
    "Dandelion",
    "Denim",
    "Ecru",
    "Emerald",
    "Eggplant",
    "Falu red",
    "Fern green",
    "Firebrick",
    "Flax",
    "Forest green",
    "French Rose",
    "Fuchsia",
    "Gamboge",
    "Gold",
    "Goldenrod",
    "Green",
    "Grey",
    "Han Purple",
    "Harlequin",
    "Heliotrope",
    "Hollywood Cerise",
    "Indigo",
    "Ivory",
    "Jade",
    "Lavender",
    "Lawn green",
    "Lemon",
    "Lemon chiffon",
    "Lilac",
    "Lime",
    "Lime green",
    "Linen",
    "Magenta",
    "Magnolia",
    "Malachite",
    "Maroon",
    "Mauve",
    "Midnight Blue",
    "Mint green",
    "Misty rose",
    "Moss green",
    "Mustard",
    "Myrtle",
    "Navajo white",
    "Navy Blue",
    "Ochre",
    "Office green",
    "Olive",
    "Olivine",
    "Orange",
    "Orchid",
    "Papaya whip",
    "Peach",
    "Pear",
    "Periwinkle",
    "Persimmon",
    "Pine Green",
    "Pink",
    "Platinum",
    "Plum",
    "Powder blue",
    "Puce",
    "Prussian blue",
    "Psychedelic purple",
    "Pumpkin",
    "Purple",
    "Raw umber",
    "Razzmatazz",
    "Red",
    "Robin egg blue",
    "Rose",
    "Royal blue",
    "Royal purple",
    "Ruby",
    "Russet",
    "Rust",
    "Safety orange",
    "Saffron",
    "Salmon",
    "Sandy brown",
    "Sangria",
    "Sapphire",
    "Scarlet",
    "School bus yellow",
    "Sea Green",
    "Seashell",
    "Sepia",
    "Shamrock green",
    "Shocking Pink",
    "Silver",
    "Sky Blue",
    "Slate grey",
    "Smalt",
    "Spring bud",
    "Spring green",
    "Steel blue",
    "Tan",
    "Tangerine",
    "Taupe",
    "Teal",
    "Tenne",
    "Terra cotta",
    "Thistle",
    "Titanium White",
    "Tomato",
    "Turquoise",
    "Tyrian purple",
    "Ultramarine",
    "Vermilion",
    "Violet",
    "Viridian",
    "Wheat",
    "White",
    "Wisteria",
    "Xanthic",
    "Yellow",
    "Zucchini"];

let adj = ["lazy",
    "stiff",
    "weary",
    "feeble",
    "synonymous",
    "faded",
    "tranquil",
    "chilly",
    "measly",
    "common",
    "nondescript",
    "kindhearted",
    "statuesque",
    "dangerous",
    "tasty",
    "average",
    "silent",
    "sweltering",
    "like",
    "sulky",
    "bright",
    "three",
    "well-off",
    "gaping",
    "trashy",
    "quiet",
    "dapper",
    "adhesive",
    "aquatic",
    "tacit",
    "curly",
    "fragile",
    "splendid",
    "evanescent",
    "slippery",
    "alluring",
    "envious",
    "vivacious",
    "imaginary",
    "elegant",
    "tenuous",
    "abject",
    "electric",
    "misty",
    "early",
    "zany",
    "uncovered",
    "enormous",
    "undesirable",
    "open",
    "shiny",
    "ruthless",
    "pricey",
    "cumbersome",
    "berserk",
    "colorful",
    "lowly",
    "absurd",
    "complex",
    "opposite",
    "toothsome",
    "big",
    "bawdy",
    "ragged",
    "insidious",
    "imported",
    "plant",
    "lacking",
    "righteous",
    "optimal",
    "irate",
    "rainy",
    "cluttered",
    "jittery",
    "unequal",
    "boiling",
    "clammy",
    "robust",
    "willing",
    "lumpy",
    "rhetorical",
    "protective",
    "harmonious",
    "puzzling",
    "loud",
    "zippy",
    "domineering",
    "watery",
    "likeable",
    "scared",
    "conscious",
    "alive",
    "hysterical",
    "incredible",
    "vigorous",
    "fortunate",
    "trite",
    "steady",
    "cool",
    "immense",
    "thirsty",
    "grotesque",
    "thankful",
    "vulgar",
    "old-fashioned",
    "previous",
    "grey",
    "gratis",
    "grateful",
    "macho",
    "magnificent",
    "amused",
    "unequaled",
    "kaput",
    "handy",
    "lively",
    "festive",
    "silly",
    "permissible",
    "reflective",
    "sassy",
    "nifty",
    "zesty",
    "rambunctious",
    "overwrought",
    "vast",
    "rabid",
    "exotic",
    "innate",
    "inconclusive",
    "spiritual",
    "different",
    "hard-to-find",
    "grouchy",
    "aboriginal",
    "thin",
    "painful",
    "ugly",
    "quack",
    "godly",
    "ad hoc",
    "keen",
    "unsightly",
    "dull",
    "alike",
    "billowy",
    "busy",
    "evasive",
    "lush",
    "valuable",
    "macabre",
    "holistic",
    "mixed",
    "depressed",
    "organic",
    "hurried",
    "able",
    "acoustic",
    "paltry",
    "cheap",
    "lavish",
    "dusty",
    "defiant",
    "knotty",
    "harsh",
    "fixed",
    "shocking",
    "subdued",
    "fallacious",
    "nauseating",
    "grandiose",
    "auspicious",
    "knowing",
    "doubtful",
    "male",
    "loutish",
    "bent",
    "obese",
    "loose",
    "handsome",
    "low",
    "ordinary",
    "uttermost",
    "furtive",
    "agreeable",
    "charming",
    "silent",
    "hulking",
    "flagrant",
    "uninterested",
    "regular",
    "spicy",
    "whimsical",
    "abusive",
    "dead",
    "shaky",
    "descriptive",
    "nonstop",
    "unused",
    "resonant"];


/* animals.forEach(animal =>{
    colours.forEach(colour =>{
        adj.forEach(adjective => {
            console.log(adjective.toLowerCase() + " " + colour.toLowerCase() + " " + animal.toLowerCase());
        })
    })
}); */

djb2Code = function(str){
    var hash = 5381;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
};

console.log(animals.length);
console.log(colours.length);
console.log(adj.length);
console.log(djb2Code('14802170-648c-11e7-b123-5bdf1e0c2b7d'));
let v = Math.abs(djb2Code('14802170-648c-11e7-b123-5bdf1e0c2b7d'));
let n1 = (v % (animals.length-1));
console.log(n1);
let n2 = (v % (colours.length-1));
console.log(n2);
let n3 = (v % (adj.length-1));
console.log(n3);
console.log(adj[n3] + " " + colours[n2] + " " + animals[n1]);