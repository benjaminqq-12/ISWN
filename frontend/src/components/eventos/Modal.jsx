import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Ventana compartida por los detalles, el formulario y la confirmación de eliminación.
const Modal = ({ titulo = 'Información del evento', onClose, bloqueado = false, children }) => {
    const ventana = useRef(null);
    const tituloId = useId();

    useEffect(() => {
        const dialog = ventana.current;
        const focoAnterior = document.activeElement;
        dialog.showModal();
        document.body.classList.add('modal-abierto');

        return () => {
            dialog.close();
            document.body.classList.remove('modal-abierto');
            if (focoAnterior?.isConnected) focoAnterior.focus();
        };
    }, []);

    const cerrarConEscape = (event) => {
        event.preventDefault();
        if (!bloqueado) onClose();
    };

    return (
        <dialog ref={ventana} className="modal" aria-labelledby={tituloId} onCancel={cerrarConEscape}>
            <div className="modal-cabecera">
                <h2 id={tituloId}>{titulo}</h2>
                <button type="button" className="boton-icono" aria-label="Cerrar ventana"
                    disabled={bloqueado} onClick={onClose}>
                    <X />
                </button>
            </div>
            <div className="modal-contenido">{children}</div>
        </dialog>
    );
};

export default Modal;
