/**
 * Lumina Reading Coach - Sample Reading Passages
 * Structured by difficulty levels (Easy, Medium, Hard)
 */
const READING_PASSAGES = [
  // ==========================================
  // EASY PASSAGES
  // ==========================================
  {
    id: "fable-tortoise",
    title: "The Tortoise and the Hare",
    difficulty: "Easy",
    category: "Fables",
    description: "The classic Aesop's fable about patience and determination.",
    text: "A Hare was making fun of the Tortoise one day for being so slow. Do you ever get there? he asked with a laugh. Yes, replied the Tortoise, and I get there sooner than you think. I will run you a race and prove it. The Hare was amused. He agreed to the race, and they started. The Hare darted almost out of sight at once. To show how easy it was, he lay down to take a nap. The Tortoise plodded along, never stopping. When the Hare woke up, he ran as fast as he could, but the Tortoise had already crossed the finish line."
  },
  {
    id: "fable-wind-sun",
    title: "The Wind and the Sun",
    difficulty: "Easy",
    category: "Fables",
    description: "A fable about how gentleness can be stronger than force.",
    text: "The Wind and the Sun had a dispute about which was the stronger. Suddenly they saw a traveler coming down the road. They agreed that the one who could make the traveler take off his coat should be called the stronger. The Wind blew as hard as he could. But the harder he blew, the more closely the traveler wrapped his coat around himself. Then the Sun shone out with all his warmth. The traveler felt the heat, grew warm, and quickly took off his coat. Gentleness was stronger than force."
  },
  {
    id: "fable-boy-wolf",
    title: "The Boy Who Cried Wolf",
    difficulty: "Easy",
    category: "Fables",
    description: "A famous tale about honesty and the consequence of lying.",
    text: "A shepherd boy minded his sheep near a dark forest. It was lonely, so he thought of a plan to have some fun. He ran toward the village crying out, Wolf! Wolf! The kind villagers left their work and came running to help him. When they arrived, they found no wolf, and the boy laughed at them. He did this three times. One day, a real wolf did come. The boy cried for help, but the villagers thought he was lying again. Nobody came, and the wolf ate the sheep."
  },
  {
    id: "science-leaves",
    title: "Why Do Leaves Change Color?",
    difficulty: "Easy",
    category: "Science",
    description: "Learn how trees prepare for winter in the autumn season.",
    text: "During spring and summer, leaves are green because they make food for the tree. They use sunlight, water, and a green helper called chlorophyll. In autumn, the days grow shorter and colder. The tree stops making food and chlorophyll fades away. As the green color goes, other bright colors show up in the leaves. We see yellow, orange, and red. Soon, the leaves dry up and fall to the ground. The tree rests all winter and grows new green leaves when spring returns."
  },
  {
    id: "history-wheel",
    title: "The Story of the Wheel",
    difficulty: "Easy",
    category: "History",
    description: "A look at one of humanity's oldest and most important inventions.",
    text: "Long ago, people had to carry everything on their backs. It was hard work. Then, they learned to pull heavy loads on wooden sleds. One day, someone noticed that rolling logs was much easier than sliding objects. They cut round slices from logs and made the very first wheels. These wheels were solid wood and very heavy. Over time, people made wheels with spokes to make them lighter and faster. Today, wheels are on cars, bikes, and planes. The wheel changed the way we travel and work."
  },

  // ==========================================
  // MEDIUM PASSAGES
  // ==========================================
  {
    id: "science-space",
    title: "Our Neighbor, Mars",
    difficulty: "Medium",
    category: "Science",
    description: "An overview of the Red Planet and why scientists explore it.",
    text: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. Often referred to as the Red Planet, its reddish color comes from the iron oxide, or rust, on its surface. Mars has a thin atmosphere, mostly made of carbon dioxide, and features polar ice caps, valleys, and massive volcanoes. Scientists are eager to study Mars because they believe it might have once supported liquid water and perhaps ancient microbial life. Robotic rovers currently explore its dusty deserts, sending back incredible pictures and data."
  },
  {
    id: "literature-arthur",
    title: "The Legend of King Arthur",
    difficulty: "Medium",
    category: "Literature",
    description: "The classic British legend of the sword in the stone.",
    text: "Long ago in England, there was no king, and the land was divided. In a churchyard stood a large stone holding a beautiful sword. Written in gold letters on the blade were the words, Whoso pulleth out this sword is rightwise King. Many brave knights tried with all their strength to draw the blade, but none could move it. Arthur was a young boy serving as a squire. He went to find a sword for his master and saw the weapon in the stone. He pulled it out easily, and the people cheered for their new king."
  },
  {
    id: "science-bees",
    title: "How Honey Bees Work",
    difficulty: "Medium",
    category: "Science",
    description: "Explore the busy life of worker bees inside a hive.",
    text: "Honey bees live in large groups called colonies. Inside a hive, thousands of busy worker bees cooperate to keep the community healthy. They fly from flower to flower collecting nectar, which is a sweet liquid. Bees carry nectar back to the hive in their honey stomachs. Once inside, they pass it to other bees who fan their wings to evaporate water from the liquid. This process turns nectar into thick, sweet honey. Bees store honey in wax cells to eat during cold winter months when flowers are gone."
  },
  {
    id: "history-great-wall",
    title: "The Great Wall of China",
    difficulty: "Medium",
    category: "History",
    description: "A summary of the construction of the famous historic wall.",
    text: "The Great Wall of China is one of the greatest wonders of the world. It is a massive series of walls, watchtowers, and fortresses built across the northern borders of China. Soldiers built the wall over hundreds of years to protect the country from invading forces. Workers used brick, stone, and packed dirt to construct it. Millions of people labored under difficult conditions to build this giant structure. Today, the wall stretches thousands of miles across mountains and deserts, and visitors travel from all over the world to walk along its ancient stones."
  },
  {
    id: "nature-coral",
    title: "The Importance of Coral Reefs",
    difficulty: "Medium",
    category: "Nature",
    description: "Discover why coral reefs are critical to ocean ecosystems.",
    text: "Coral reefs are built by tiny marine animals called coral polyps. Although reefs cover less than one percent of the ocean floor, they are home to more than a quarter of all marine life. Fish, crabs, turtles, and sea plants find shelter and food in the coral. Reefs also protect coastlines from ocean waves during big storms. Unfortunately, pollution and rising water temperatures are damaging corals worldwide. Saving these beautiful underwater cities is important for the survival of the oceans and the millions of people who depend on them."
  },

  // ==========================================
  // HARD PASSAGES
  // ==========================================
  {
    id: "history-lincoln",
    title: "The Gettysburg Address",
    difficulty: "Hard",
    category: "History",
    description: "President Abraham Lincoln's historic and powerful speech from 1863.",
    text: "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this."
  },
  {
    id: "history-seattle",
    title: "Chief Seattle's Message",
    difficulty: "Hard",
    category: "History",
    description: "An extract from the legendary Native American environmental address.",
    text: "Every part of this earth is sacred to my people. Every shining pine needle, every sandy shore, every mist in the dark woods, every clearing and humming insect is holy in the memory and experience of my people. The sap which courses through the trees carries the memories of the red man. We are part of the earth and it is part of us. The perfumed flowers are our sisters; the deer, the horse, the great eagle, these are our brothers. The rocky crests, the juices in the meadows, the body warmth of the pony, and man, all belong to the same family."
  },
  {
    id: "biography-einstein",
    title: "The Genius of Einstein",
    difficulty: "Hard",
    category: "Biography",
    description: "A summary of the physicist's revolutionary theories and legacy.",
    text: "Albert Einstein was a theoretical physicist widely acknowledged to be one of the greatest scientists of all time. Born in Germany, he developed the theory of relativity, which revolutionized our understanding of space, time, gravity, and the universe. His famous equation, energy equals mass times the speed of light squared, explained how mass and energy are connected. Einstein received the Nobel Prize in Physics for his explanation of the photoelectric effect. Beyond his intellectual achievements, he was a passionate advocate for global peace, cooperation, and civil rights until his death."
  },
  {
    id: "science-currents",
    title: "Ocean Currents and Climate",
    difficulty: "Hard",
    category: "Science",
    description: "How marine conveyor belts regulate temperature across the globe.",
    text: "Ocean currents function like massive marine conveyor belts, transporting heat, nutrients, and moisture around the globe. Driven by wind, gravity, and differences in water density, these currents have a profound influence on regional climates. For example, the Gulf Stream carries warm tropical water northward along the Atlantic coast, keeping Western Europe significantly warmer than it would otherwise be at that latitude. As warm water travels toward the polar regions, it cools, increases in salinity, sinks to the deep ocean, and flows back toward the equator, regulating Earth's temperature systems."
  },
  {
    id: "mythology-eldorado",
    title: "The Legend of El Dorado",
    difficulty: "Hard",
    category: "Mythology",
    description: "The historical myth of the golden city that captivated explorers.",
    text: "The legend of El Dorado originated in the Andes mountains of South America, where the Muisca civilization performed sacred ceremonies. During these rituals, their king would cover himself in sticky sap and gold dust before plunging into a holy lake as an offering to the gods. When Spanish conquistadors heard rumors of a king made of gold, their imaginations transformed the ceremony into a mythical city of gold. For centuries, European explorers launched dangerous expeditions into the dense jungles, risking death and disease in a futile search for wealth that never existed."
  }
];
