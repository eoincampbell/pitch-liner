# Improved Color Support.

In config.js there's an array of colors and hex lines. This has some short comings.

1. There are only 8 colors available.
1. The map marker colors are based on predefined azure maps marker pins which do not align with their base colors.
1. There are no comments beside the array to explain the human readable color

I would like you to suggest a better array of more colors. 
I also believe that it is possible to specify the use of custom pins from SVG image templates with Azure Maps which would allow the use of any color and shape for the map markers.
See examples below.


var PATH_COLORS = [
    { line: '#ff0000', pin: 'pin-0', hex: '#ff0000' },
    { line: '#1e90ff', pin: 'pin-1', hex: '#1e90ff' },
    // ...one entry per colour, pin name matching the index
];

...
// Inside the map 'ready' handler, BEFORE any path sources are created.
var promises = md.PATH_COLORS.map(function (c, i) {
    return md.map.imageSprite.createFromTemplate(
        'pin-' + i,      // id referenced by iconOptions.image
        'marker',        // built-in template name
        c.hex,           // primary (fill) colour
        '#ffffff'        // secondary (outline) colour
    );
});

Promise.all(promises).then(function () {
    // Safe to create path layers now.
});


In addition, the color of the path should be customizable by the user. There's a little circular dot beside the path information. Clicking on this should display a simple color picker, with the options within it, corresponding to our PATH_COLORS array.

