/*
Created by me
 */


//for username generation
let animals = ["Aardvark", "Anteater", "Antelope", "Fox", "Hare", "Wolf", "Armadillo", "Aye", "Baboon", "Badger", "Bandicoot", "Bat", "Bear", "Beaver", "Tiger", "Binturong", "Bison", "Black Bear", "Bobcat", "Bongo", "Bonobo", "Bear", "Buffalo", "Camel", "Capybara", "Caracal", "Cat", "Chamois", "Cheetah", "Chimpanzee", "Chinchilla", "Chipmunk", "Coati", "Cougar", "Cow", "Coyote", "Cuscus", "Deer", "Dhole", "Dingo", "Dog", "Dolphin", "Donkey", "Dormouse", "Dugong", "Echidna", "Elephant", "Ferret", "Fossa", "Fur Seal", "Gerbil", "Gibbon", "Giraffe", "Goat", "Gopher", "Gorilla", "Grey Seal", "Hamster", "Hare", "Hedgehog", "Hippopotamus", "Horse", "Human", "Whale", "Hyena", "Impala", "Indri", "Jackal", "Jaguar", "Kangaroo", "Koala", "Kudu", "Lemming", "Lemur", "Leopard", "Liger", "Lion", "Llama", "Lynx", "Manatee", "Mandrill", "Markhor", "Meerkat", "Mole", "Mongoose", "Monkey", "Moose", "Mountain Gorilla", "Mouse", "Mule", "Neanderthal", "Numbat", "Ocelot", "Okapi", "Opossum", "Orang-utan", "Otter", "Pademelon", "Panther", "Pig", "Pika", "Platypus", "Porcupine", "Possum", "Puma", "Quokka", "Quoll", "Rabbit", "Raccoon", "Raccoon Dog", "Rat", "Panda", "Reindeer", "Rhinoceros", "Dolphin", "Hyrax", "Saola", "Seal", "Serval", "Sheep", "Skunk", "Sloth", "Squirrel", "Stoat", "Tapir", "Tarsier", "Uakari", "Wallaby", "Walrus", "Warthog", "Weasel", "Wildebeest", "Wolverine", "Wombat", "Yak", "Zebra", "Zebu", "Zonkey", "Zorse", "Alligator", "Caiman", "Chameleon", "Crocodile", "Gecko", "Gharial", "Iguana", "Lizard", "Tortoise", "Tuatara"];
let colours = ["Alizarin", "Amaranth", "Amber", "Amethyst", "Apricot", "Aqua", "Aquamarine", "Asparagus", "Auburn", "Azure", "Beige", "Bistre", "Black", "Blue", "Brass", "Bronze", "Brown", "Buff", "Burgundy", "Cardinal", "Carmine", "Celadon", "Cerise", "Cerulean", "Champagne", "Charcoal", "Chartreuse", "Chestnut", "Chocolate", "Cinnabar", "Cinnamon", "Cobalt", "Copper", "Coral", "Corn", "Cornflower", "Cream", "Crimson", "Cyan", "Dandelion", "Denim", "Ecru", "Emerald", "Eggplant", "Firebrick", "Flax", "Fuchsia", "Gamboge", "Gold", "Goldenrod", "Green", "Grey", "Harlequin", "Heliotrope", "Indigo", "Ivory", "Jade", "Lavender", "Lawn green", "Lemon", "Lilac", "Lime", "Linen", "Magenta", "Magnolia", "Malachite", "Maroon", "Mauve", "Mustard", "Myrtle", "Ochre", "Olive", "Olivine", "Orange", "Orchid", "Peach", "Pear", "Periwinkle", "Persimmon", "Pink", "Platinum", "Plum", "Puce", "Pumpkin", "Purple", "Razzmatazz", "Red", "Rose", "Ruby", "Russet", "Rust", "Saffron", "Salmon", "Sangria", "Sapphire", "Scarlet", "Seashell", "Sepia", "Silver", "Sky Blue", "Smalt", "Tan", "Tangerine", "Taupe", "Teal", "Tenne", "Thistle", "Tomato", "Turquoise", "Ultramarine", "Vermilion", "Violet", "Viridian", "Wheat", "White", "Wisteria", "Xanthic", "Yellow", "Zucchini"];
let adj = ["lazy", "stiff", "weary", "feeble", "synonymous", "faded", "tranquil", "chilly", "measly", "common", "nondescript", "kindhearted", "statuesque", "dangerous", "tasty", "average", "silent", "sweltering", "like", "sulky", "bright", "three", "well-off", "gaping", "trashy", "quiet", "dapper", "adhesive", "aquatic", "tacit", "curly", "fragile", "splendid", "evanescent", "slippery", "alluring", "envious", "vivacious", "imaginary", "elegant", "tenuous", "abject", "electric", "misty", "early", "zany", "uncovered", "enormous", "undesirable", "open", "shiny", "ruthless", "pricey", "cumbersome", "berserk", "colorful", "lowly", "absurd", "complex", "opposite", "toothsome", "big", "bawdy", "ragged", "insidious", "imported", "plant", "lacking", "righteous", "optimal", "irate", "rainy", "cluttered", "jittery", "unequal", "boiling", "clammy", "robust", "willing", "lumpy", "rhetorical", "protective", "harmonious", "puzzling", "loud", "zippy", "domineering", "watery", "likeable", "scared", "conscious", "alive", "hysterical", "incredible", "vigorous", "fortunate", "trite", "steady", "cool", "immense", "thirsty", "grotesque", "thankful", "vulgar", "old-fashioned", "previous", "grey", "gratis", "grateful", "macho", "magnificent", "amused", "unequaled", "kaput", "handy", "lively", "festive", "silly", "permissible", "reflective", "sassy", "nifty", "zesty", "rambunctious", "overwrought", "vast", "rabid", "exotic", "innate", "inconclusive", "spiritual", "different", "hard-to-find", "grouchy", "aboriginal", "thin", "painful", "ugly", "quack", "godly", "ad hoc", "keen", "unsightly", "dull", "alike", "billowy", "busy", "evasive", "lush", "valuable", "macabre", "holistic", "mixed", "depressed", "organic", "hurried", "able", "acoustic", "paltry", "cheap", "lavish", "dusty", "defiant", "knotty", "harsh", "fixed", "shocking", "subdued", "fallacious", "nauseating", "grandiose", "auspicious", "knowing", "doubtful", "male", "loutish", "bent", "obese", "loose", "handsome", "low", "ordinary", "uttermost", "furtive", "agreeable", "charming", "silent", "hulking", "flagrant", "uninterested", "regular", "spicy", "whimsical", "abusive", "dead", "shaky", "descriptive", "nonstop", "unused", "resonant"];

module.exports = {

  /**
   * @param req
   * @param res
   * @param next - next function in pipe
   */
  getRandomUserName: (req, res, next) => {
    let session = req.session;
    if (session.title && session.title !== null) {
      session.nickname = session.title
    }
    if (!session.pseudo || !session.nickname){
      if (!session.pseudo || session.pseudo === undefined || session.pseudo === '' || session.pseudo === 'undefined'){
        session.pseudo = Math.floor(Math.random() * 1000 * new Date());
      }
      session.pseudo = parseInt(session.pseudo);
      let n1 = (session.pseudo % (animals.length-1));
      let n2 = (session.pseudo % (colours.length-1));
      let n3 = (session.pseudo % (adj.length-1));
      session.nickname = (adj[n3] + " " + colours[n2] + " " + animals[n1]).toLowerCase();
    }
    next();
  }

};