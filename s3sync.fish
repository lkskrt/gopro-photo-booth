#!/usr/bin/env fish

. .env-sync.local

if test -z "$AWS_S3_URI"
    echo "AWS_S3_URI not set!"

    exit 1
end

set interval 10s
set src public/photos/
set dest "sync"
set destSmall "$dest/.thumbnails/small"
set destLarge "$dest/.thumbnails/large"

# rm -rf $dest
mkdir -p $src
mkdir -p $destSmall
mkdir -p $destLarge

echo "Cleaning"
aws s3 sync --delete $dest $AWS_S3_URI

while true
    set newPhotos (rsync -a --dry-run --ignore-existing --out-format='%f' $src $dest)
    set -e newPhotos[1]
    set newPhotoCount (count $newPhotos)
    echo "Found $newPhotoCount new photos"

    if test $newPhotoCount -gt 0
        echo $newPhotos

        rsync -a --ignore-existing $src $dest

        echo 'Compressing'

        magick mogrify -auto-orient -resize 400x -crop 400x267+0+0 -gravity center -format webp -quality 70 -path $destSmall $newPhotos

        magick mogrify -resize 1920x -auto-orient -format webp -quality 70 -path $destLarge $newPhotos

        echo 'Syncing'
        aws s3 sync $dest $AWS_S3_URI
    end

    echo "Waiting $interval"
    sleep $interval
end
