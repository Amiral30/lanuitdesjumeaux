document.addEventListener('DOMContentLoaded', () => {
    const clickZone = document.getElementById('click-zone');
    const placeholderContent = document.getElementById('placeholder-content');
    const fileInput = document.getElementById('image-upload');
    const finalUserPhoto = document.getElementById('final-user-photo');
    const btnExport = document.getElementById('btn-export');
    
    const modal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const btnCancel = document.getElementById('btn-cancel');
    const btnValidate = document.getElementById('btn-validate');
    
    const exportCanvas = document.getElementById('export-canvas');
    const posterBg = document.getElementById('poster-bg');

    let cropper = null;
    let croppedImageURL = null; 

    // 1. Clic sur le cercle -> Ouvre l'explorateur de fichiers
    clickZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 2. Fichier sélectionné -> Ouvre la modale et initialise Cropper
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            if (!file.type.match('image.*')) {
                alert('Veuillez sélectionner une image (JPG ou PNG).');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                modal.removeAttribute('hidden');
                initCropper();
            };
            reader.readAsDataURL(file);
        }
        fileInput.value = ''; // Reset input
    });

    function initCropper() {
        if (cropper) cropper.destroy();
        
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1, // Force le carré (pour faire un cercle)
            viewMode: 1,
            dragMode: 'move', // Déplacer l'image
            autoCropArea: 0.9,
            restore: false,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    }

    // 3. Annuler -> Ferme la modale
    btnCancel.addEventListener('click', () => {
        modal.setAttribute('hidden', 'true');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    });

    // 4. Valider -> Récupère l'image et l'affiche en fond
    btnValidate.addEventListener('click', () => {
        if (!cropper) return;

        // On récupère le canvas recadré (taille fixe pour la qualité, ex: 800x800)
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 800,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        // On convertit en base64
        croppedImageURL = canvas.toDataURL('image/png');
        
        // On l'affiche sur l'espace de travail
        finalUserPhoto.src = croppedImageURL;
        finalUserPhoto.removeAttribute('hidden');
        
        // On cache le texte et on enlève le fond/bordure de la zone de clic pour que ça soit propre
        placeholderContent.style.display = 'none';
        clickZone.style.background = 'transparent';
        clickZone.style.border = 'none';

        // On active le bouton d'export
        btnExport.removeAttribute('disabled');
        btnExport.innerHTML = '<span>Télécharger mon affiche</span> <i class="fas fa-download"></i>';

        // On ferme la modale
        modal.setAttribute('hidden', 'true');
        cropper.destroy();
        cropper = null;
    });

    btnExport.addEventListener('click', () => {
        if (!croppedImageURL) return;
        
        btnExport.innerHTML = '<span>Génération en cours...</span> <i class="fas fa-circle-notch fa-spin"></i>';

        // L'image de fond est DÉJÀ chargée à l'écran, pas besoin de la recharger
        const width = posterBg.naturalWidth;
        const height = posterBg.naturalHeight;
        
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');

        // --- CALCUL AUTOMATIQUE DEPUIS LE CSS ---
        const styles = getComputedStyle(document.documentElement);
        
        // On récupère les valeurs et on les convertit en nombre (ex: "34%" -> 0.34)
        const circleTopPercent = parseFloat(styles.getPropertyValue('--circle-top')) / 100;
        const circleLeftPercent = parseFloat(styles.getPropertyValue('--circle-left')) / 100;
        const circleSizePercent = parseFloat(styles.getPropertyValue('--circle-size')) / 100;

        const photoX = width * circleLeftPercent;
        const photoY = height * circleTopPercent;
        const photoSize = width * circleSizePercent;

        const userPhoto = new Image();
        userPhoto.onload = () => {
            
            // 1. Dessiner la photo recadrée (découpée en rond parfait)
            ctx.save();
            ctx.beginPath();
            ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip(); // Masque d'écrêtage
            ctx.drawImage(userPhoto, photoX, photoY, photoSize, photoSize);
            ctx.restore();

            // 2. Dessiner l'affiche PAR-DESSUS (le trou transparent laissera voir la photo)
            ctx.drawImage(posterBg, 0, 0, width, height);

            // Export final
            try {
                const dataURL = exportCanvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.download = 'Affiche_Concert_Marial.png';
                link.href = dataURL;
                link.click();
            } catch (err) {
                alert("Erreur de sécurité du navigateur en local (CORS). Le site fonctionnera parfaitement une fois en ligne !");
                console.error(err);
            }
            
            btnExport.innerHTML = '<span>Télécharger mon affiche</span> <i class="fas fa-download"></i>';
        };
        userPhoto.src = croppedImageURL;
    });
});
