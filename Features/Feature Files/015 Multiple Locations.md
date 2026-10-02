# Support for Multiple Locations

Whitehall Colmcille has a number of different pitch locations. Right now the system is 
centered on Ellenfield Park (Location 1) with a default zoom level of 15. 
The system should support multiple locations with the ability to switch between them.

The system should support all the following locations:

| Venue Name | Coordinates & Zoom |
| Ellenfield Park | 53.386252, -6.241229, 18 |
| Collins Ave Pitch | 53.380961, -6.241105, 18 |
| Cloghran Pitch | 53.412840, -6.239898, 18 |
| Lorcan Green | 53.392869, -6.230036, 18|
| Belcamp Park | 53.407263, -6.210329, 18 | 
| St. Aidans | 53.383338, -6.251518, 18 |

These locations should be placed in a configurable JS array 
so that they are easily modified or added to in future including 
the default zoom level for each location.

The system should default to Ellenfield Park on load, but allow the 
user to switch between locations using a dropdown. The drop down should 
be placed adjacent to the search bar in the top center of the the UX.

If there are already pins or paths active on the map and the user attempts 
to switch to a different location, the user should be prompted whether they wish to continue.
	- Yes: Clear the map of pins and paths and recenter the map on the new location.
	- No: Cancel the location switch and remain on the current location.

The current value of the location selector should also be stored, 
and restored as part of Save/Load/URL Hash.  But the actual map center 
coordinates AND zoom level should be stored/restored as well, seperately. 
That way if the user moves the map off centr of the default location, 
it'll restore to where they had positioned it exactly.
