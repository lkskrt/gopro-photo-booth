#!/usr/bin/env fish

if test -z "$AWS_S3_URI"
    echo "AWS_S3_URI not set!"

    exit 1
end

set src public/photos/
set dest public/photos-compressed/

mkdir -p $src
mkdir -p $dest

while true
    echo 'Getting new photos'
    set newPhotos (rsync -a --dry-run --ignore-existing --out-format='%f' $src $dest)
    set -e newPhotos[1]
    set newPhotoCount (count $newPhotos)
    echo "Found $newPhotoCount new photos"

    if test $newPhotoCount -gt 0
        echo $newPhotos

        echo 'Compressing'
        magick mogrify -resize 1920x -quality 70 -path $dest $newPhotos
    end

    echo 'Syncing'
    aws s3 sync $dest $AWS_S3_URI

    echo 'Waiting'
    sleep 30s
end