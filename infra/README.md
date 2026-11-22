# Infraestructura y despliegue

## Recursos que Terraform declara

- VCN `10.82.0.0/16` con subred pública `10.82.1.0/24` y privada `10.82.2.0/24`.
- Gateway y ruta pública a Internet.
- Reglas de red: SSH limitado al runner, puertos 80 y 443 públicos.
- VM flexible con Ubuntu 24.04 e IP pública efímera.
- Backend remoto de estado de Terraform en OCI Object Storage.

La forma `VM.Standard.E5.Flex` (1 OCPU, 4 GB RAM) puede generar cargos según la cuenta y región. `terraform apply` se ejecuta en el job de `main` cuando estén listos sus secretos. No se debe subir `terraform.tfstate`, `*.tfvars`, claves privadas ni la carpeta `.terraform/`.

## Requisitos previos para GitHub Actions

En **Settings → Secrets and variables → Actions**, configura:

### Secrets

| Nombre | Contenido |
| --- | --- |
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub. |
| `DOCKERHUB_TOKEN` | Token de acceso de Docker Hub. |
| `OCI_TENANCY_OCID` | OCID del tenancy. |
| `OCI_USER_OCID` | OCID del usuario OCI que creó la clave API. |
| `OCI_FINGERPRINT` | Fingerprint de esa clave API. |
| `OCI_PRIVATE_KEY` | Clave API privada OCI completa, en secreto. |
| `OCI_COMPARTMENT_OCID` | OCID del compartment destino. |
| `VM_SSH_PUBLIC_KEY` | Clave pública SSH que se instala en la VM. |
| `VM_SSH_PRIVATE_KEY` | Parte privada correspondiente, protegida como secret. |
| `VNC_PASSWORD` | Contraseña VNC de al menos 8 caracteres. |

### Variables

| Nombre | Contenido |
| --- | --- |
| `OCI_REGION` | Por ejemplo `sa-santiago-1`. |
| `OCI_STATE_BUCKET` | Nombre de un bucket OCI Object Storage ya creado. |
| `OCI_NAMESPACE` | Namespace Object Storage de OCI. |
| `SITE_DOMAIN` | Opcional. Dominio propio apuntado a la VM. Si queda vacío, Caddy escucha en HTTP y se genera además una URL temporal `trycloudflare.com`. |

El backend remoto usa la clave `dudamapa/terraform.tfstate` dentro del bucket, separada del estado de otros proyectos. Si no tienes todavía un bucket, créalo una sola vez en OCI Object Storage antes del primer push a `main`.

## Qué ocurre en cada rama

- Push o Pull Request hacia `dev`: unitarios, integración, compilación y E2E.
- Push a `main`: pasa las pruebas, construye `${DOCKERHUB_USERNAME}/dudamapa` para `linux/amd64`, publica `latest` y el SHA, aplica Terraform y ejecuta Ansible.
- Ansible instala Docker, Git, UFW/iptables, XFCE y TigerVNC; despliega la imagen de Docker Hub.
- VNC escucha solo en loopback de la VM. Para conectarlo desde tu computadora:

  ```bash
  ssh -L 5901:127.0.0.1:5901 ubuntu@IP_PUBLICA
  ```

  Después configura el cliente VNC para `localhost:5901` e introduce el secreto `VNC_PASSWORD`.

## URL gratuita de Cloudflare sin comprar dominio

El Compose de producción inicia `cloudflared tunnel --url http://app:3000`. Cloudflare publica una URL temporal aleatoria `https://....trycloudflare.com`; Ansible la muestra en el registro del job. No hace falta comprar dominio ni crear una cuenta Cloudflare. La URL es para demostraciones: al detener o reiniciar el túnel puede cambiar y la anterior deja de responder. La IP pública de OCI continúa disponible aparte en `terraform output public_url`.

Para una URL fija se necesita un dominio agregado a Cloudflare y un túnel administrado con credenciales. Esa opción se deja como futura variable, no se inventa ni se configura sin dominio. Quick Tunnels no ofrecen garantía de disponibilidad y Cloudflare los destina a pruebas y desarrollo.
