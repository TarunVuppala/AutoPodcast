// PSUDO-PROGRAMMING CODE STEPS I TOOK JUST TO MAKE A CUT USING EXTENTSCRIPT IN PREMIERE PRO
// 0. get the project item reference from selected clip, clip.projectItem
// 1. get video track that the clip is on
// 2. get the play head position, just incase you want to visualize the cuts being made
// 3. calculate the time of the clip the playhead is over, that will be the in point, and get the out point
// 4. set the project item in point and out point, for video, audio, or all
// 5. insert the clip onto the track at the playhead position track.overwriteClip();
// 6. deselect the track to avoid any issues

function main(cutPositions) {
    var activeSequence = app.project.activeSequence;
    if (activeSequence) {
        // get selection of track items
        var trackItems = activeSequence.getSelection();
        if (trackItems.length > 0) {
            // CAVEAT: linked video and audio track items on the same track,
            // example: track item on Video 1 and Audio 1, video track item will appear first in the array.
            // however, if video track is on Video 2 and audio track is on Audio 1, audio track item will appear first element in array.

            // ARE YOU LOOKING AT ONLY CUTTING VIDEO TRACKS OR AUDIO TRACKS?
            // get track item type you want to reference in your selection of track items.
            var mediaType = 'Video'; // or 'Audio'
            var tracks = (mediaType == 'Video') ? activeSequence.videoTracks : activeSequence.audioTracks;

            // remove the track items from the selection you don't want to process                
            for (var i = 0; i < trackItems.length; i++) {
                var trackItem = trackItems[i];
                // we will use the "mediaType" STRING, instead of the "type" INT
                // trackItem.mediaType == "Video" or trackItem.mediaType == "Audio"
                // INSEAD OF
                // trackItem.type == 1 or trackItem.type == 2

                // if track item is not the media type you initialized above, then remove it from the array
                if (trackItem.mediaType != mediaType) {
                    trackItems.splice(trackItems.indexOf(trackItem), 1);
                }
            }

            // loop over all the track items in the new array and do cuts
            for (var i = 0; i < trackItems.length; i++) {
                // USE THIS VARIABLE TO PASS INTO OTHER FUNCTIONS TO REFERENCE THE CURRENT TRACK ITEM BEING WORKED ON
                var trackItem = trackItems[i];

                for (var j = 0; j < tracks.length; j++) {
                    var track = tracks[j];
                    var clips = track.clips;
                    for (var k = 0; k < clips.length; k++) {
                        if (clips[k].name == trackItem.name) {
                            trackItem.track = track; // used to store the track that our track item is on
                        }
                    }
                }

                // just check if the track item is on a track, which it should be, if not do nothing
                if (trackItem.track == null) return;

                // THIS PART IS SUPER IMPORTANT, ADDING 2 TIME OBJECTS TO THE TRACK ITEM FOR REFERENCE LATER
                // get the sequence time of the playhead
                trackItem.sequencePlayheadPosition = activeSequence.getPlayerPosition();
                // get the track item time of the playhead
                trackItem.playheadPosition = new Time();
                trackItem.playheadPosition.seconds = trackItem.sequencePlayheadPosition.seconds - trackItem.start.seconds + trackItem.inPoint.seconds;

                if (cutPositions) {
                    // THIS IS PROBABLY WHAT MOST PEOPLE WANT TO DO
                    cutFromTimeArray(trackItem, cutPositions)
                }
                else {
                    // JUST A BASIC CUT AT THE CURRENT PLAYHEAD POSITION
                    cutFromPlayhead(trackItem);
                }
                // deselect the everything and update the UI
                var itemsToDeselect = activeSequence.getSelection();
                for (var i = 0; i < itemsToDeselect.length; i++) {
                    itemsToDeselect[i].setSelected(0, 1);
                }
            }
        } else {
            alert("Please select a track item (clip) on the timeline");
        }
    }
}

function cutFromPlayhead(trackItem) {
    // get project item of the selected clip
    var projectItem = trackItem.projectItem;

    // perform cut at playhead position
    projectItem.setInPoint(trackItem.inPoint.ticks, 4);
    projectItem.setOutPoint(trackItem.playheadPosition.ticks, 4);
    trackItem.track.overwriteClip(projectItem, trackItem.start.ticks);
}

function cutFromTimeArray(trackItem, cutPositions) {
    // get project item of the selected clip
    var projectItem = trackItem.projectItem;

    for (var cut = 0; cut < cutPositions.length; cut++) {
        // get the sequence time of the cut
        var cutPosition = cutPositions[cut];
        // move playhead to the cut position
        app.project.activeSequence.setPlayerPosition(cutPosition.ticks);

        // if cut position is not on the track item, do nothing and continue to the next cut position
        // if cut position is over the track item, move the playhead to the cut poision and DO THE CUT!
        // performing a cut isn't actually splitting the track item, rather it takes the project item reference to the track item,
        // adjusts the in and out point, then places it on the timeline over the track item, AKA "Add Edit"
        if (cutPosition.seconds <= trackItem.start.seconds || cutPosition.seconds >= trackItem.end.seconds) {
            continue;
        }
        else {
            // get track item time of the cut position in the sequence
            var playheadPosition = new Time();
            playheadPosition.seconds = cutPosition.seconds - trackItem.start.seconds + trackItem.inPoint.seconds;

            projectItem.setInPoint(trackItem.inPoint.ticks, 4); // 1 for video, 2 for audio, 4 for all
            projectItem.setOutPoint(playheadPosition.ticks, 4); // 1 for video, 2 for audio, 4 for all
            trackItem.track.overwriteClip(projectItem, trackItem.start.ticks);
        }
    }
}

// PLEASE COMMENT/UNCOMMENT THE MAIN FUNCTION.
// USE ONE AT A TIME, SINCE EVERYTIME IT IS RUN, IT DESELECTS EVERYTHING

// DO SINGLE CUT AT PLAYHEAD POSITION
var cutPositions = []
cutPositions.push(app.project.activeSequence.getPlayerPosition());
main(cutPositions);

// OR

// MULTI-CUT, MAKE AN ARRAY OF TIME OBJECTS
// in my example, I made 3 cuts, one at the playhead time, the others 1 and 2 seconds after playhead time
var cutPositions = [];
var cut1 = app.project.activeSequence.getPlayerPosition();
cut1.seconds = cut1.seconds + 1; // first cut 1 second after playhead
var cut2 = new Time();
cut2.seconds = cut1.seconds + 1; // 1 second ahead of the first cut
var cut3 = new Time();
cut3.seconds = cut2.seconds + 1; // 1 second ahead of the second cut
cutPositions.push(cut1, cut2, cut3); // put all the cut times (based on sequence/playhead time) into an array
//main(cutPositions);