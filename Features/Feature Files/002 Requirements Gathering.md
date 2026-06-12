#  Round 2

I need some additonal minor changes.

1. Modify the pin icon to be red, and slightly smaller than the default pin icon.
2. When a pin is placed draw a dotted line between it and the previous pin it's connected to.
3. Add onscreen tools for zooming in and out of the map, and for resetting the map to the default view (centered on the default coordinates, with the default zoom and aerial mode) and for switching between aerial and other modes.
4. Add a "Save" button which allows the user to download a CSV file of the pin data (Pin #, Lat, Long, Distance from Previous Pin, Total Distance). The file should be named "pin_data.csv".
5. Add a "Load" button which allows the user to upload a CSV file of pin data (in the same format as the "Save" button) and have the pins, lines, and table data populate based on the contents of the file.
6. Add a "Help" button which opens a modal window with instructions on how to use the application, including how to place pins, interpret the table data, and use the zoom and view tools.
7. Ensure that the application is responsive and works well on both desktop and mobile devices, with appropriate adjustments to the layout and controls for smaller screens.
8. Implement error handling for the "Load" button to manage cases where the uploaded CSV file is not in the correct format, providing user feedback on what went wrong and how to fix it.
9. Put a Whitehall Colmcille GAA Title and Logo in the top right corner.
10. Add a search bar in the top center to be able to relocate the map on another location using a geo search based on a human readable address. The search should use the Azure Maps Search Service and update the map view to the location of the search result when a user selects an address from the search suggestions.
11. Create a file in Features folder called "003 Suggested features" that adds 10 additional suggestions that could be implemented so I can review them.
