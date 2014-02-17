// --------------------------------------------------------------------------------------------------------------------
// <copyright file="Startup.cs" company="Hewlett-Packard">
//   Copyright © 2014 Hewlett-Packard
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

[assembly: Microsoft.Owin.OwinStartup(typeof(App.Tribe.Startup))]

namespace App.Tribe
{
    using Owin;

    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            //// For more information on how to configure your application, visit:
            //// http://go.microsoft.com/fwlink/?LinkID=316888

            this.ConfigureAuth(app);
        }
    }
}
