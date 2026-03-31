export type Show = {

id: string; 
title: string; 
year: number; 
platform: string; 
genre: string; 
seasons: number; 
rating: number; 
description: string; 
image: string; 
}; 


export const shows: Show[] = [
{
id: "1", 
title: "Breaking Bad", 
year: 2008, 
platform: "Netfix", 
genre: "Crime", 
seasons: 5, 
rating: 4.9, 
description: "A chemistry teacher turns to making meth.", 
image: "https://placehold.co/300x450?text=Breaking+Bad",
},

{
id: "2",
title: "The Bear",
year: 2022,
platform: "Hulu",
genre: "Drama", 
seasons: 2,
rating: 4.7,
description: "A chef returns home to run a sandwich shop.",
image: "https://placehold.co/300x450?text=The+Bear",
},

{
id: "3",
title: "Stranger Things",
year: 2016,
platform: "Netflix",
genre: "Sci-fi",
seasons: 4,
rating: 4.6,
description: "Kids uncover supernatural mysteries.",
image: "https://placehold.co/300x450?text=Stranger+Things",
}
];
  
