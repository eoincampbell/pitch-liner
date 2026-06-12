# Initial Spec

The application is designed to help coaches measure areas on a map down to the nearest meter. (e.g. for lining a football pitch).

Modify the Index.html file to include

Azure Maps - The map displayed should take up the entire page.
A default zoom of 18
A default view in aerial mode
A default center position of LAT: 53.386252, LON: -6.241229

In the top left corner of the map, there should be a partial transparent dark rectangular area. This area should contain light text on the darker background. It will be used to display distance stats in tabular format.

An example of this table would be.

| Pin # | Lat | Long | Distance from Previous Pin | Total Distance |
|-------|-----|------|----------------------------|----------------|
| 1     | 53.386252 | -6.241229 | N/A                        | 0m             |
| 2     | 53.386244 | -6.241233 | 20m                        | 20m             |
| 3     | 53.386245 | -6.241236 | 20m                        | 40m             |

This area should also include a "Clear" button which resets the table, and removes all pins from the map.

When a user clicks on the map , a pin should be placed at the location of the click. The table should be updated with the new pin's coordinates, the distance from the previous pin, and the total distance from the first pin.

The Azure Maps should use my API KEY which is [CENSORED]

