#!/bin/bash

export SCRIPTS_PATH=$PWD/scripts
export VIDEOS_PATH=$PWD/videos

for i in $VIDEOS_PATH/* ; do
    if [ -d "$i" ]; then
        for j in $VIDEOS_PATH/$(basename "$i")/audio-split/*.mp3 ; do
            k=$(echo $(basename "$j") | rev | cut -c 5- | rev)
            path=$VIDEOS_PATH/$(basename "$i")/audio-split/$k
            python -m aeneas.tools.execute_task \
                $path.mp3 \
                $path.txt \
                "task_language=ru|os_task_file_format=json|is_text_type=plain" \
                $path.json
        done
    fi
done
