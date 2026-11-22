output "public_ip" {
  description = "IP pública asignada a la VM Ubuntu 24.04."
  value       = oci_core_instance.dudamapa.public_ip
}

output "public_url" {
  description = "URL HTTP de DudaMapa mientras no se configure un dominio."
  value       = "http://${oci_core_instance.dudamapa.public_ip}"
}

output "vcn_id" {
  value = oci_core_vcn.dudamapa.id
}

output "subnet_public_id" {
  value = oci_core_subnet.public.id
}

output "subnet_private_id" {
  value = oci_core_subnet.private.id
}
