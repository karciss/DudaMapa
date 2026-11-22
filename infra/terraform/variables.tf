variable "region" {
  description = "Región OCI donde se crea DudaMapa."
  type        = string
  default     = "sa-santiago-1"
}

variable "tenancy_ocid" {
  description = "OCID del tenancy OCI."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID del compartment que contendrá los recursos."
  type        = string
}

variable "ssh_public_key" {
  description = "Clave pública SSH que se instala para el usuario ubuntu."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "Origen autorizado para SSH (recomendado: IP del runner /32)."
  type        = string
  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "Escribe un CIDR válido, por ejemplo 203.0.113.10/32."
  }
}

variable "instance_shape" {
  description = "Shape OCI para la VM Ubuntu 24.04."
  type        = string
  default     = "VM.Standard.E5.Flex"
}

variable "ocpus" {
  description = "Número de OCPU para la VM flexible."
  type        = number
  default     = 1
}

variable "memory_gb" {
  description = "Memoria RAM asignada a la VM."
  type        = number
  default     = 4
}

variable "image_ocid" {
  description = "OCID opcional de una imagen Ubuntu 24.04. Vacío selecciona la más reciente compatible."
  type        = string
  default     = ""
}
