using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;

namespace ATS_WinForms
{
    public partial class LOGIN : Form
    {
        public static string Token { get; set; }

        public LOGIN()
        {
            InitializeComponent();
        }


        //Variables
        bool VisibilidadContraseña;

        //FUNCIONES
        private void MostrarClave_Click(object sender, EventArgs e)
        {
            if (VisibilidadContraseña == false)
            {
                TB_CLAVE.PasswordChar = '\0';
                VisibilidadContraseña = true;
                MostrarClave.Image = ATS_WinForms.Properties.Resources.cerrar_ojo1;
            }
            else
            {
                TB_CLAVE.PasswordChar = '*';
                VisibilidadContraseña = false;
                MostrarClave.Image = ATS_WinForms.Properties.Resources.foto;
            }
        }

        private void BT_SALIR_Click(object sender, EventArgs e)
        {
           Menu menu = new Menu(usuario);
            menu.Show();
            this.Hide();
        }

        private void TB_USUARIO_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                TB_CLAVE.Focus();
                e.Handled = true;
                e.SuppressKeyPress = true;
            }
            if (TB_USUARIO.Text.Length >= 10 && e.KeyCode != Keys.Back)
            {
                e.Handled = true;
                e.SuppressKeyPress = true;
            }
        }

        private void TB_CLAVE_KeyDown(object sender, KeyEventArgs e)
        {
            if (TB_CLAVE.Text.Length >= 10 && e.KeyCode != Keys.Back)
            {
                e.Handled = true;
                e.SuppressKeyPress = true;
            }
        }

        string usuario;

        private async void BT_ENTRAR_Click(object sender, EventArgs e)
        {
            usuario = TB_USUARIO.Text;
            string contrasena = TB_CLAVE.Text;

            // Validación de campos vacíos
            if (string.IsNullOrEmpty(usuario) && string.IsNullOrEmpty(contrasena))
            {
                MessageBox.Show("Por favor ingresa el usuario y la contraseña.", "Campos vacíos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(usuario))
            {
                MessageBox.Show("El campo usuario está vacío.", "Campo vacío", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(contrasena))
            {
                MessageBox.Show("El campo contraseña está vacío.", "Campo vacío", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            bool exito = await HacerLoginAsync(usuario, contrasena);

            if (exito)
            {
                Menu menu = new Menu(usuario);
                menu.Show();
                this.Hide();
            }
        }

        private async Task<bool> HacerLoginAsync(string usuario, string contrasena)
        {
            using (HttpClient client = new HttpClient())
            {
                var login = new LoginRequest
                {
                    username = usuario,
                    password = contrasena
                };

                var json = JsonConvert.SerializeObject(login);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                try
                {
                    var response = await client.PostAsync("https://backendsas.onrender.com/api/auth/login", content);

                    if (response.IsSuccessStatusCode)
                    {
                        string responseBody = await response.Content.ReadAsStringAsync();

                        dynamic resultado = JsonConvert.DeserializeObject(responseBody);
                        SesionActual.Token = resultado.token;  // 🔐 Token guardado

                        return true;
                    }
                    else
                    {
                        MessageBox.Show("Login fallido: Contraseña o usuario incorrectos " + response.StatusCode);
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error de red: " + ex.Message);
                    return false;
                }
            }
        }

        public class LoginRequest
        {
            public string username { get; set; }
            public string password { get; set; }
        }


    }
}
