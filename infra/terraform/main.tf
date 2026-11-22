data "oci_identity_availability_domains" "available" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "ubuntu_2404" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_vcn" "dudamapa" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.82.0.0/16"]
  display_name   = "vcn-dudamapa"
  dns_label      = "dudamapa"
}

resource "oci_core_internet_gateway" "dudamapa" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.dudamapa.id
  display_name   = "igw-dudamapa"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.dudamapa.id
  display_name   = "rutas-publicas-dudamapa"

  route_rules {
    network_entity_id = oci_core_internet_gateway.dudamapa.id
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
  }
}

resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.dudamapa.id
  display_name   = "rutas-privadas-dudamapa"
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.dudamapa.id
  display_name   = "seguridad-publica-dudamapa"

  ingress_security_rules {
    protocol    = "6"
    source      = var.ssh_allowed_cidr
    source_type = "CIDR_BLOCK"
    description = "SSH limitado al runner de despliegue"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    description = "HTTP público"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    description = "HTTPS público"
    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.dudamapa.id
  display_name   = "seguridad-privada-dudamapa"

  egress_security_rules {
    protocol         = "all"
    destination      = "10.82.0.0/16"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.dudamapa.id
  cidr_block                 = "10.82.1.0/24"
  display_name               = "subred-publica-dudamapa"
  dns_label                  = "publica"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  prohibit_internet_ingress  = false
}

resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.dudamapa.id
  cidr_block                 = "10.82.2.0/24"
  display_name               = "subred-privada-dudamapa"
  dns_label                  = "privada"
  route_table_id             = oci_core_route_table.private.id
  security_list_ids          = [oci_core_security_list.private.id]
  prohibit_public_ip_on_vnic = true
  prohibit_internet_ingress  = true
}

resource "oci_core_instance" "dudamapa" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.available.availability_domains[0].name
  display_name        = "ubuntu-2404-dudamapa"
  shape               = var.instance_shape

  dynamic "shape_config" {
    for_each = endswith(var.instance_shape, ".Flex") ? [1] : []
    content {
      ocpus         = var.ocpus
      memory_in_gbs = var.memory_gb
    }
  }

  source_details {
    source_type             = "image"
    source_id               = var.image_ocid != "" ? var.image_ocid : data.oci_core_images.ubuntu_2404.images[0].id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    display_name     = "vnic-dudamapa"
    hostname_label   = "dudamapa-web"
  }

  metadata = {
    ssh_authorized_keys = trimspace(var.ssh_public_key)
  }
}
